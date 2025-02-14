function showMessage(title, info) {
  const messageBox = document.getElementById('message-box');
  const msgTitle = document.getElementById('msg-title');
  const msgInfo = document.getElementById('msg-info');

  msgTitle.innerText = title;
  msgInfo.innerText = info;

  messageBox.classList.add('show');

  setTimeout(() => {
    messageBox.classList.remove('show');
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  const successMessage = "<%= success %>";
  const errorMessage = "<%= error %>";

  if (successMessage) {
    showMessage('Success', successMessage);
  }

  if (errorMessage) {
    showMessage('Error', errorMessage);
  }
});
