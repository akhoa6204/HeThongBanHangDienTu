import {fetchApiCheckOtp, fetchApiGenerateOtp} from '../service/verifyOTP/fetchApi.js';
const formValidate = document.querySelector('.validate');
const inputValidate = formValidate.querySelectorAll('input');
const span = document.querySelector('.error-message');
inputValidate.forEach((input, index) => {
    input.addEventListener("input", (e) => {
        let value = e.target.value;

        value = value.replace(/\D/g, "");
        if (value.length > 1) {
            const chars = value.split("");
            for (let i = 0; i < chars.length && (index + i) < inputValidate.length; i++) {
                inputValidate[index + i].value = chars[i];
            }
            const nextIndex = index + value.length;
            if (nextIndex < inputValidate.length) {
                inputValidate[nextIndex].focus();
            }
        } else {
            input.value = value;
            if (value && index < inputValidate.length - 1) {
                inputValidate[index + 1].focus();
            }
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) {
            inputValidate[index - 1].focus();
        }
    });

    input.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");
        pasteData.split("").forEach((char, i) => {
            if (i < inputValidate.length) {
                inputValidate[i].value = char;
            }
        });
        if (pasteData.length < inputValidate.length) {
            inputValidate[pasteData.length].focus();
        } else {
            inputValidate[inputValidate.length - 1].focus();
        }
    });
});
formValidate.addEventListener('submit', (event) => {
    event.preventDefault();
    span.textContent = "";
    let otp ='';
    inputValidate.forEach(input =>{
        otp+= input.value;
    })
    if (otp.length < 6){
        span.textContent = "OTP không được để trống";
        return;
    }
    fetchApiCheckOtp(otp)
    .then(data => {
        window.location.href = '/reset-password/';
    })
    .catch(error=>{
         span.textContent = error.message;
    })
})
const timeSpan = document.querySelector('.time');
const refresh = document.querySelector('span.refresh');
let totalSeconds = 5 * 60;
let countdown;

function startCountdown() {
  totalSeconds = 5 * 60;
  refresh.classList.remove('active');

  if (countdown) clearInterval(countdown);

  countdown = setInterval(() => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    timeSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    totalSeconds--;

    if (totalSeconds < 0) {
      clearInterval(countdown);
      refresh.classList.add('active');
    }
  }, 1000);
}

startCountdown();

refresh.addEventListener('click', (event) => {
  if (!event.target.classList.contains('active')) return;
  startCountdown();
  fetchApiGenerateOtp()
  .then(data => {
    refresh.classList.add('active');
  })
  .catch(error => {
    span.textContent = error.message;
  })
});


