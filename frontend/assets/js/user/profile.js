document.addEventListener('DOMContentLoaded', async () => {
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const profileImage = document.getElementById('profileImage');
  const imageInput = document.getElementById('imageInput');
  const cameraBtn = document.getElementById('cameraBtn');
  const saveBtn = document.getElementById('saveBtn');
  const userName = document.querySelector('.profile-card h6');
  const greeting = document.querySelector('.profile-card small');
  const genderRadios = document.querySelectorAll('input[name="gender"]');
  const editButtons = document.querySelectorAll('.edit-btn[data-target]');
  let savedPhone = '';

  cameraBtn?.addEventListener('click', () => imageInput?.click());

  imageInput?.addEventListener('change', async () => {
    const image = imageInput.files?.[0];
    if (!image) return;
    if (!image.type.startsWith('image/')) {
      alert('Choose an image file');
      imageInput.value = '';
      return;
    }
    if (image.size > 5 * 1024 * 1024) {
      alert('Choose an image smaller than 5 MB');
      imageInput.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', image);

    try {
      cameraBtn.disabled = true;
      const response = await fetch('/user/profile/image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to upload profile photo');

      setFormData(data.user);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Unable to upload profile photo');
    } finally {
      cameraBtn.disabled = false;
      imageInput.value = '';
    }
  });

  editButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;

      input.readOnly = false;
      input.focus();
      input.select();
    });
  });

  const setFormData = (user) => {
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.mobile || '';
    savedPhone = user.mobile || '';
    if (profileImage) {
      profileImage.src = user.profileImage || 'https://i.pravatar.cc/150';
    }
    if (userName) userName.textContent = user.name || 'User';
    if (greeting) greeting.textContent = 'Hello';

    genderRadios.forEach((radio) => {
      radio.checked = radio.value === (user.gender || '');
    });
  };

  try {
    const response = await fetch('/user/profile/data', {
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load profile');
    }

    setFormData(data.user);
  } catch (error) {
    console.error(error);
    alert(error.message || 'Unable to load profile');
  }

  saveBtn?.addEventListener('click', async () => {
    const selectedGender = document.querySelector('input[name="gender"]:checked')?.value || '';
    const name = nameInput?.value.trim() || '';

    if (!name) {
      alert('Name is required');
      nameInput?.focus();
      return;
    }

    const phone = phoneInput?.value.trim() || '';
    if (phone !== savedPhone) {
      if (!phone) {
        alert('Enter a phone number with country code, for example +919876543210');
        phoneInput?.focus();
        return;
      }

      try {
        saveBtn.disabled = true;
        const response = await fetch('/user/change-phone/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ phone }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to send OTP');

        sessionStorage.setItem('otpFlow', 'change-phone');
        sessionStorage.setItem('changePhone', phone);
        window.location.assign('/user/change-phone/verify');
      } catch (error) {
        console.error(error);
        alert(error.message || 'Unable to send OTP');
        saveBtn.disabled = false;
      }
      return;
    }

    try {
      saveBtn.disabled = true;
      const response = await fetch('/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email: emailInput?.value || '',
          phone: phoneInput?.value || '',
          gender: selectedGender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update profile');
      }

      setFormData(data.user);
      if (nameInput) nameInput.readOnly = true;
      if (phoneInput) phoneInput.readOnly = true;
      alert('Profile updated successfully');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Unable to update profile');
    } finally {
      saveBtn.disabled = false;
    }
  });
});
