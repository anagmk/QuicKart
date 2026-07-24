document.addEventListener('DOMContentLoaded', async () => {
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const profileImage = document.getElementById('profileImage');
  const saveBtn = document.getElementById('saveBtn');
  const userName = document.querySelector('.profile-card h6');
  const greeting = document.querySelector('.profile-card small');
  const genderRadios = document.querySelectorAll('input[name="gender"]');

  const setFormData = (user) => {
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.mobile || '';
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

    try {
      const response = await fetch('/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: nameInput?.value || '',
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
      alert('Profile updated successfully');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Unable to update profile');
    }
  });
});
