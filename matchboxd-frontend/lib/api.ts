export async function updateUserProfile(data: {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  profileImageFile?: File;
}) {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  if (data.username) formData.append("Username", data.username);
  if (data.email) formData.append("Email", data.email);
  if (data.currentPassword) formData.append("CurrentPassword", data.currentPassword);
  if (data.newPassword) formData.append("NewPassword", data.newPassword);
  if (data.confirmNewPassword) formData.append("ConfirmNewPassword", data.confirmNewPassword);
  if (data.profileImageFile) formData.append("ProfileImage", data.profileImageFile);

  const res = await fetch("http://localhost:5011/api/settings", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
