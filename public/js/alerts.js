function showPopUp(result) {

	title = result.title || "Message";
	info = result.message || "Undefined";
	const messageBox = document.querySelector('.pop-up'); // Update this line
	const msgTitle = document.querySelector('.msg-title'); // Use querySelector
	const msgInfo = document.querySelector('.msg-info');


	msgTitle.innerText = title;
	msgInfo.innerText = info;

	messageBox.classList.add('show');

	setTimeout(() => {
	  messageBox.classList.remove('show');
	}, 3000);
  }