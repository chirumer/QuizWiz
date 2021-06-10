(async function() {

const time_display_ele = document.getElementById('quiz_time_display');
const { open_at, close_at } = await get_quiz_timing('/get-quiz-timing');

display_time();
const timer_id = window.setInterval(display_time, 500);

const start_button = document.getElementById('start_button');
start_button.addEventListener('click', async () => {
    const response = await fetch('/is-quiz-open');
    if (!response.ok) {
        console.log('failed to check quiz status');
        return;
    }
    const data = await response.json();
    if (!data.is_open) {
        window.alert('quiz not yet open');
        return;
    }
    window.location.assign('/registration')
});

async function get_quiz_timing(url) {
    const response = await fetch(url);
    if (!response.ok) {
	console.log('failed to get quiz timing');
	return;
    }
    const { open_at, close_at } = await response.json();
    return { open_at, close_at };
}

function display_time() {
    let time;
    if (Date.now() < open_at) {
        time = Math.round((open_at-Date.now())/1000);
        time_display_ele.innerText = 'Quiz starts in: ';
    }
    else if (Date.now() >= open_at && Date.now() < close_at) {
        time = Math.round((close_at-Date.now())/1000);
        time_display_ele.innerText = 'Quiz ends in: ';
    }
    else {
        time_display_ele.innerText = 'Quiz has closed';
        return;
    }
    const seconds = time % 60;
    const minutes = Math.floor(time/60) % 60
    const hours = Math.floor(time/(60*60))
    const time_string = ` ${hours}h ${minutes}m ${seconds}s`;
    time_display_ele.innerText += time_string;
}

})();
