/**
 * Client-side script for RideGo Demo Payment Checkout
 */
document.addEventListener('DOMContentLoaded', function () {
  const methodCardRadio = document.getElementById('methodDemoCard');
  const methodCashRadio = document.getElementById('methodCash');
  const demoCardSection = document.getElementById('demoCardFields');
  const cashNoticeSection = document.getElementById('cashNoticeFields');
  const paymentForm = document.getElementById('paymentForm');
  const submitBtn = document.getElementById('submitPaymentBtn');
  const cardNumberInput = document.getElementById('cardNumber');

  // Toggle Payment Method Views
  function togglePaymentMethods() {
    if (methodCardRadio && methodCardRadio.checked) {
      if (demoCardSection) demoCardSection.style.display = 'block';
      if (cashNoticeSection) cashNoticeSection.style.display = 'none';
      setRequiredCardFields(true);
    } else if (methodCashRadio && methodCashRadio.checked) {
      if (demoCardSection) demoCardSection.style.display = 'none';
      if (cashNoticeSection) cashNoticeSection.style.display = 'block';
      setRequiredCardFields(false);
    }
  }

  function setRequiredCardFields(isRequired) {
    const cardFields = ['cardName', 'cardNumber', 'expiryDate', 'cvv'];
    cardFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (isRequired) {
          el.setAttribute('required', 'required');
        } else {
          el.removeAttribute('required');
        }
      }
    });
  }

  if (methodCardRadio) methodCardRadio.addEventListener('change', togglePaymentMethods);
  if (methodCashRadio) methodCashRadio.addEventListener('change', togglePaymentMethods);

  // Format Card Number input with spaces (4-4-4-4)
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, '');
      value = value.substring(0, 16);
      const parts = [];
      for (let i = 0; i < value.length; i += 4) {
        parts.push(value.substring(i, i + 4));
      }
      e.target.value = parts.join(' ');
    });
  }

  // Double submission protection & button state
  if (paymentForm && submitBtn) {
    paymentForm.addEventListener('submit', function (e) {
      if (!paymentForm.checkValidity()) {
        return; // Allow native HTML5 validation UI
      }

      // Disable submit button & show spinner
      submitBtn.disabled = true;
      submitBtn.classList.add('disabled');
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing Payment...';
    });
  }

  // Initial setup call
  togglePaymentMethods();
});
