(function() {

const start_button = document.getElementById('start_button');
start_button.addEventListener('click', async () => {
    const response = await fetch('/is-quiz-open');
    if (!response.ok) {
        console.log('failed to check quiz status');
        return;
    }
    const data = await response.json();
    if (!data.is_open) {
        alert('quiz not yet open');
        return;
    }
    window.location.assign('/registration')
});

})();
