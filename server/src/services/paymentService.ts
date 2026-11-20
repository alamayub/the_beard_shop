import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../../src/db/index.ts';
import { bookings, payments } from '../../../src/db/schema.ts';

export type PaymentProvider = 'CASH' | 'ESEWA' | 'KHALTI' | 'FONEPAY';

export async function initiatePaymentSession(bookingRef: string, provider: PaymentProvider) {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.bookingRef, bookingRef))
    .limit(1);

  if (rows.length === 0) {
    throw new Error('Booking reference not found.');
  }

  const booking = rows[0];
  const transactionUuid = `${booking.bookingRef}-${Date.now()}`;

  if (provider === 'CASH') {
    return {
      provider: 'CASH',
      status: 'PAY_AT_SALON',
      amountNpr: booking.totalPriceNpr,
      transactionRef: transactionUuid,
      message: 'Cash payment selected. Please settle in NPR at the salon reception upon arrival.',
    };
  }

  if (provider === 'ESEWA') {
    const productCode = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
    const secretKey = process.env.ESEWA_SECRET_KEY || '';
    const signedFieldNames = 'total_amount,transaction_uuid,product_code';
    const message = `total_amount=${booking.totalPriceNpr},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = secretKey
      ? crypto.createHmac('sha256', secretKey).update(message).digest('base64')
      : null;

    await db.insert(payments).values({
      bookingId: booking.id,
      provider: 'ESEWA',
      amountNpr: booking.totalPriceNpr,
      status: 'PENDING_VERIFICATION',
      transactionRef: transactionUuid,
      providerPayload: { productCode, sandboxConfigured: Boolean(secretKey) },
    });

    return {
      provider: 'ESEWA',
      sandboxUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
      sandboxConfigured: Boolean(secretKey),
      transactionRef: transactionUuid,
      amountNpr: booking.totalPriceNpr,
      payload: {
        amount: booking.totalPriceNpr,
        tax_amount: 0,
        total_amount: booking.totalPriceNpr,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        signed_field_names: signedFieldNames,
        signature,
      },
      message: secretKey
        ? 'eSewa sandbox payload signed server-side. Complete payment via eSewa sandbox and verify on return.'
        : 'eSewa sandbox architecture is active. Configure ESEWA_SECRET_KEY on the server to enable live sandbox signing. Booking remains reserved as Pending Verification.',
    };
  }

  if (provider === 'KHALTI') {
    const configured = Boolean(process.env.KHALTI_SECRET_KEY);
    await db.insert(payments).values({
      bookingId: booking.id,
      provider: 'KHALTI',
      amountNpr: booking.totalPriceNpr,
      status: 'PENDING_VERIFICATION',
      transactionRef: transactionUuid,
      providerPayload: { sandboxConfigured: configured, amountPaisa: booking.totalPriceNpr * 100 },
    });

    return {
      provider: 'KHALTI',
      sandboxUrl: 'https://a.khalti.com/api/v2/epayment/initiate/',
      sandboxConfigured: configured,
      transactionRef: transactionUuid,
      amountNpr: booking.totalPriceNpr,
      amountPaisa: booking.totalPriceNpr * 100,
      message: configured
        ? 'Khalti ePayment sandbox ready for server-side lookup verification.'
        : 'Khalti sandbox integration architecture is ready. Configure KHALTI_SECRET_KEY on the server for real sandbox verification.',
    };
  }

  const configured = Boolean(process.env.FONEPAY_SECRET_KEY);
  await db.insert(payments).values({
    bookingId: booking.id,
    provider: 'FONEPAY',
    amountNpr: booking.totalPriceNpr,
    status: 'PENDING_VERIFICATION',
    transactionRef: transactionUuid,
    providerPayload: { sandboxConfigured: configured },
  });

  return {
    provider: 'FONEPAY',
    sandboxUrl: 'https://dev-clientapi.fonepay.com/api/merchantRequest',
    sandboxConfigured: configured,
    transactionRef: transactionUuid,
    amountNpr: booking.totalPriceNpr,
    message: configured
      ? 'Fonepay PRN request prepared for sandbox verification.'
      : 'Fonepay QR & merchant integration architecture is ready. Configure FONEPAY_MERCHANT_CODE and FONEPAY_SECRET_KEY on the server.',
  };
}

export async function verifyOnlinePayment(params: {
  provider: 'ESEWA' | 'KHALTI' | 'FONEPAY';
  transactionRef: string;
  pidx?: string;
}) {
  // Never fake a successful payment verification.
  // Require real server-side provider credentials and official API verification.
  if (params.provider === 'KHALTI' && process.env.KHALTI_SECRET_KEY && params.pidx) {
    const response = await fetch('https://a.khalti.com/api/v2/epayment/lookup/', {
      method: 'POST',
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx: params.pidx }),
    });
    const data = (await response.json()) as { status?: string; transaction_id?: string };
    if (response.ok && data.status === 'Completed') {
      const updated = await db
        .update(payments)
        .set({ status: 'VERIFIED', verifiedAt: new Date(), providerPayload: data })
        .where(eq(payments.transactionRef, params.transactionRef))
        .returning();
      if (updated[0]) {
        await db
          .update(bookings)
          .set({ paymentStatus: 'PAID', updatedAt: new Date() })
          .where(eq(bookings.id, updated[0].bookingId));
      }
      return { verified: true, provider: 'KHALTI', data };
    }
    return { verified: false, provider: 'KHALTI', reason: 'Provider did not return Completed status', data };
  }

  return {
    verified: false,
    provider: params.provider,
    status: 'PENDING_PROVIDER_VERIFICATION',
    message:
      'Online payment verification is never mocked. Configure official sandbox credentials on the server to verify transactions directly with the payment gateway, or settle Cash at Salon via the Admin dashboard.',
  };
}
