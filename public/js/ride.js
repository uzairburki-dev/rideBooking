/**
 * RideGo — Customer Ride Booking Frontend Interactions
 */
document.addEventListener('DOMContentLoaded', () => {

  const pickupInput = document.getElementById('pickupAddress');
  const destInput = document.getElementById('destinationAddress');
  const pickupLatInput = document.getElementById('pickupLat');
  const pickupLngInput = document.getElementById('pickupLng');
  const destLatInput = document.getElementById('destLat');
  const destLngInput = document.getElementById('destLng');
  const rideTypeInputs = document.querySelectorAll('input[name="rideType"]');
  const summaryDistance = document.getElementById('summaryDistance');
  const summaryFare = document.getElementById('summaryFare');
  const summaryTier = document.getElementById('summaryTier');
  const estimateAlert = document.getElementById('estimateAlert');
  const presetButtons = document.querySelectorAll('.btn-preset');

  // Helper: Trigger AJAX fare estimate recalculation
  async function fetchFareEstimate() {
    const pickupAddress = pickupInput ? pickupInput.value.trim() : '';
    const destinationAddress = destInput ? destInput.value.trim() : '';

    if (!pickupAddress || !destinationAddress) {
      if (summaryDistance) summaryDistance.textContent = '-- KM';
      return;
    }

    if (pickupAddress.toLowerCase() === destinationAddress.toLowerCase()) {
      if (estimateAlert) {
        estimateAlert.className = 'alert alert-warning border-0 mb-0 small';
        estimateAlert.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-1"></i> Pickup and destination locations must be different.';
        estimateAlert.classList.remove('d-none');
      }
      if (summaryDistance) summaryDistance.textContent = '0 KM';
      return;
    }

    try {
      const response = await fetch('/customer/rides/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pickupAddress,
          destinationAddress,
          pickupLat: pickupLatInput ? pickupLatInput.value : undefined,
          pickupLng: pickupLngInput ? pickupLngInput.value : undefined,
          destLat: destLatInput ? destLatInput.value : undefined,
          destLng: destLngInput ? destLngInput.value : undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Reset alert box
        if (estimateAlert) {
          estimateAlert.className = 'alert alert-info border-0 mb-0 small';
          estimateAlert.innerHTML = '<i class="fa-solid fa-circle-info me-1"></i> Distance and fare are calculated using exact location coordinates upon booking.';
        }

        // Store coordinates
        if (data.pickup && pickupLatInput && pickupLngInput) {
          pickupLatInput.value = data.pickup.lat;
          pickupLngInput.value = data.pickup.lng;
        }
        if (data.destination && destLatInput && destLngInput) {
          destLatInput.value = data.destination.lat;
          destLngInput.value = data.destination.lng;
        }

        // Update distance display
        if (summaryDistance) {
          summaryDistance.textContent = `${data.distance} KM`;
        }

        // Update fares for all cards
        if (data.estimates) {
          Object.keys(data.estimates).forEach(type => {
            const fareEl = document.getElementById(`fare_${type}`);
            if (fareEl) {
              fareEl.textContent = `Rs. ${data.estimates[type].fare}`;
            }
          });

          // Update active summary fare
          const selectedType = document.querySelector('input[name="rideType"]:checked')?.value || 'Economy';
          if (data.estimates[selectedType] && summaryFare) {
            summaryFare.textContent = `Rs. ${data.estimates[selectedType].fare}`;
          }
        }
      } else {
        if (estimateAlert) {
          estimateAlert.className = 'alert alert-danger border-0 mb-0 small';
          estimateAlert.innerHTML = `<i class="fa-solid fa-circle-exclamation me-1"></i> ${data.error || 'Invalid locations.'}`;
        }
        if (summaryDistance) summaryDistance.textContent = '-- KM';
      }
    } catch (err) {
      console.error('[Frontend Fare Estimate Error]:', err);
    }
  }

  // Handle Preset Quick Clicks
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-pickup');
      const d = btn.getAttribute('data-dest');
      if (pickupInput) pickupInput.value = p;
      if (destInput) destInput.value = d;
      fetchFareEstimate();
    });
  });

  // Handle Input Changes
  if (pickupInput) {
    pickupInput.addEventListener('change', fetchFareEstimate);
    pickupInput.addEventListener('blur', fetchFareEstimate);
  }
  if (destInput) {
    destInput.addEventListener('change', fetchFareEstimate);
    destInput.addEventListener('blur', fetchFareEstimate);
  }

  // Handle Ride Type Radio Selection
  rideTypeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const selectedType = e.target.value;
      if (summaryTier) summaryTier.textContent = selectedType;

      const fareEl = document.getElementById(`fare_${selectedType}`);
      if (fareEl && summaryFare) {
        summaryFare.textContent = fareEl.textContent;
      }
    });
  });

  // Initial estimate check if values are prefilled
  if (pickupInput && pickupInput.value && destInput && destInput.value) {
    fetchFareEstimate();
  }

});
