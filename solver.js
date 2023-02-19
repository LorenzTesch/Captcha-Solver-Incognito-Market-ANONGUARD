/* This value might need some tweaking. The pixels of the 2 images, do not share the exact color values. When they are compared later on, we must account for some varience. */
const allowedVariance = 50;

const inpSlider = document.querySelector('input[type=range]');

const sliderMin = parseInt(inpSlider.min);
const sliderMax = parseInt(inpSlider.max);
const offsetTop = parseInt(window.getComputedStyle(inpSlider).getPropertyValue('top'));


const imgCaptcha = new Image();
const imgSlider = new Image();

var resolveCaptcha = undefined;
var resolveSlider = undefined;

var waitForLoad = Promise.all([
    new Promise((_res) => { resolveCaptcha = _res; }),
    new Promise((_res) => { resolveSlider = _res; })
]);

waitForLoad.then(solve);

imgCaptcha.onload = resolveCaptcha;
imgSlider.onload = resolveSlider;

/* Obtains the base64 code of the images. */
const captchaBase64 = window.getComputedStyle(document.querySelector('.captcha')).backgroundImage.replace('url("', '').replace('")', '');
const sliderBase64 = document.head.querySelector('style').innerHTML.split(/::-moz-range-thumb[ {\n]+background-image:[ ]?url\(/)[1].split(')')[0];

imgCaptcha.src = captchaBase64;
imgSlider.src = sliderBase64;

function isSimiliar(x, y){
    return Math.abs(y - x) <= allowedVariance;
}

function solve(){

    console.log('Both images loaded.');

    var canvasCaptcha = document.createElement('canvas');
    canvasCaptcha.width = imgCaptcha.width;
    canvasCaptcha.height = imgCaptcha.height;

    var contextCaptcha = canvasCaptcha.getContext('2d');
    contextCaptcha.drawImage(imgCaptcha, 0, 0);

    var imageDataCaptcha = contextCaptcha.getImageData(0, 0, canvasCaptcha.width, canvasCaptcha.height);


    var canvasSlider = document.createElement('canvas');
    canvasSlider.width = imgSlider.width;
    canvasSlider.height = imgSlider.height;

    var contextSlider = canvasSlider.getContext('2d');
    contextSlider.drawImage(imgSlider, 0, 0);

    var imageDataSlider = contextSlider.getImageData(0, 0, canvasSlider.width, canvasSlider.height);


    /* crop image to relevant line */
    imageDataCaptcha = [...imageDataCaptcha.data].slice(
        canvasCaptcha.width * offsetTop * 4,
        canvasCaptcha.width * (offsetTop + 1/* sliderHeight */) * 4,
    );

    imageDataSlider = [...imageDataSlider.data].slice(
        0,
        imgSlider.width * 4
    );

    var imageDataCaptchaReduced = [];
    var imageDataSliderReduced = [];

    for(let i = 0; i < imageDataCaptcha.length; i+=4){
        //imageDataCaptchaReduced.push(`${imageDataCaptcha[i + 0]},${imageDataCaptcha[i + 1]},${imageDataCaptcha[i + 2]},${imageDataCaptcha[i + 3]}`);
        imageDataCaptchaReduced.push(imageDataCaptcha[i + 0] + imageDataCaptcha[i + 1] + imageDataCaptcha[i + 2]); // sum up the rgb values
    }

    for (let i = 0; i < imageDataSlider.length; i += 4) {
        //imageDataSliderReduced.push(`${imageDataSlider[i + 0]},${imageDataSlider[i + 1]},${imageDataSlider[i + 2]},${imageDataSlider[i + 3]}`);
        imageDataSliderReduced.push(imageDataSlider[i + 0] + imageDataSlider[i + 1] + imageDataSlider[i + 2]); // sum up the rgb values
    }

    console.log(imageDataCaptchaReduced);
    console.log(imageDataSliderReduced);

    var maxStreak = 0;
    var maxStreakOffset = 0;

    /* Find the best match of the pixel's color values. */
    for (let i = 0; i < imageDataCaptchaReduced.length - imageDataSliderReduced.length; i++){

        if (isSimiliar(imageDataCaptchaReduced[i], imageDataSliderReduced[0])){

            var rightOffset = i;

            for (let j = 0; j < imageDataSliderReduced.length; j++){

                if (!isSimiliar(imageDataCaptchaReduced[rightOffset + j], imageDataSliderReduced[j])){
                    break;
                }

                if (j > maxStreak){
                    maxStreak = j;
                    maxStreakOffset = i;
                    console.log('streak at', i, j);
                }

            }

        }

    }

    /* Calculate how much the slider should move. */
    var answer = (sliderMax - sliderMin) * ( ( maxStreakOffset + imgSlider.width/2 ) / imgCaptcha.width) + sliderMin;

    inpSlider.value = answer;

    console.log('The answer is', answer);
}


