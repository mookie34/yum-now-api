const paymentsRepository = require("../repositories/payments-repository");
const {
  ValidationError,
  NotFoundError,
  DuplicateError,
} = require("../errors/custom-errors");
const { parsePagination } = require("../utils/sanitize");

const VALID_STATUSES = ["pending", "verified", "rejected"];
const CASH_PAYMENT_CODE = "cash";

class PaymentsService {
  validateOrderId(orderId) {
    if (!orderId || isNaN(orderId) || parseInt(orderId) <= 0) {
      throw new ValidationError("order_id invalido");
    }
  }

  validateReceiptImageUrl(url) {
    if (typeof url !== "string" || url.trim().length === 0) {
      throw new ValidationError("La URL del comprobante es obligatoria");
    }
    if (url.length > 500) {
      throw new ValidationError(
        "La URL del comprobante no puede exceder 500 caracteres"
      );
    }
  }

  validateAmountReported(amount) {
    if (amount === undefined || amount === null) {
      throw new ValidationError("El monto reportado es obligatorio");
    }
    if (isNaN(amount) || parseFloat(amount) < 0) {
      throw new ValidationError(
        "El monto reportado debe ser un numero valido no negativo"
      );
    }
  }

  validateStatus(status) {
    if (!status || !VALID_STATUSES.includes(status)) {
      throw new ValidationError(
        `Estado invalido. Debe ser uno de: ${VALID_STATUSES.join(", ")}`
      );
    }
  }

  validateVerifyData(verifyData) {
    const { verified_by, status } = verifyData;

    if (!verified_by || typeof verified_by !== "string" || verified_by.trim().length === 0) {
      throw new ValidationError("verified_by es obligatorio");
    }

    if (!status || !["verified", "rejected"].includes(status)) {
      throw new ValidationError(
        "El estado de verificacion debe ser 'verified' o 'rejected'"
      );
    }
  }

  isCashPayment(paymentMethodCode) {
    return paymentMethodCode === CASH_PAYMENT_CODE;
  }

  async createPayment(paymentData) {
    const { order_id, receipt_image_url, cash_given } = paymentData;

    this.validateOrderId(order_id);

    const order = await paymentsRepository.getOrderWithPaymentMethod(order_id);
    if (!order) {
      throw new NotFoundError("Orden no encontrada");
    }

    const existingPayment = await paymentsRepository.getByOrderId(order_id);
    if (existingPayment) {
      throw new DuplicateError("Ya existe un pago registrado para esta orden");
    }

    const dataToCreate = { order_id };

    if (this.isCashPayment(order.payment_method_code)) {
      if (cash_given !== undefined && cash_given !== null) {
        if (isNaN(cash_given) || parseFloat(cash_given) < 0) {
          throw new ValidationError(
            "cash_given debe ser un numero valido no negativo"
          );
        }
        dataToCreate.cash_given = parseFloat(cash_given);
        dataToCreate.change_due = parseFloat(cash_given) - parseFloat(order.total);
      }
    } else {
      if (receipt_image_url) {
        this.validateReceiptImageUrl(receipt_image_url);
        dataToCreate.receipt_image_url = receipt_image_url.trim();
      }
    }

    return await paymentsRepository.create(dataToCreate);
  }

  async verifyPayment(orderId, verifyData) {
    this.validateOrderId(orderId);
    this.validateVerifyData(verifyData);

    const payment = await paymentsRepository.getByOrderId(orderId);
    if (!payment) {
      throw new NotFoundError("Pago no encontrado para esta orden");
    }

    if (payment.status !== "pending") {
      throw new ValidationError("Solo se pueden verificar pagos en estado pendiente");
    }

    return await paymentsRepository.verify(orderId, {
      verified_by: verifyData.verified_by.trim(),
      status: verifyData.status,
      admin_notes: verifyData.admin_notes || null,
    });
  }

  async updateReceiptImage(orderId, receiptImageUrl) {
    this.validateOrderId(orderId);
    this.validateReceiptImageUrl(receiptImageUrl);

    const payment = await paymentsRepository.getByOrderId(orderId);
    if (!payment) {
      throw new NotFoundError("Pago no encontrado para esta orden");
    }

    if (payment.status !== "pending") {
      throw new ValidationError(
        "Solo se puede actualizar el comprobante de un pago pendiente"
      );
    }

    return await paymentsRepository.updateReceiptImage(
      orderId,
      receiptImageUrl.trim()
    );
  }

  async updateAmountReported(orderId, amountReported) {
    this.validateOrderId(orderId);
    this.validateAmountReported(amountReported);

    const payment = await paymentsRepository.getByOrderId(orderId);
    if (!payment) {
      throw new NotFoundError("Pago no encontrado para esta orden");
    }

    if (payment.status !== "pending") {
      throw new ValidationError(
        "Solo se puede actualizar el monto de un pago pendiente"
      );
    }

    return await paymentsRepository.updateAmountReported(
      orderId,
      parseFloat(amountReported)
    );
  }

  async getPaymentByOrderId(orderId) {
    this.validateOrderId(orderId);

    const payment = await paymentsRepository.getByOrderId(orderId);
    if (!payment) {
      throw new NotFoundError("Pago no encontrado para esta orden");
    }

    return payment;
  }

  async getPaymentsByStatus(status, limit, offset) {
    this.validateStatus(status);
    const pagination = parsePagination(limit, offset);
    return await paymentsRepository.getByStatus(
      status,
      pagination.limit,
      pagination.offset
    );
  }

  async getAllPayments(limit, offset) {
    const pagination = parsePagination(limit, offset);
    return await paymentsRepository.getAll(pagination.limit, pagination.offset);
  }
}

module.exports = new PaymentsService();
