// ==UserScript==
// @name         Tomato Timer
// @version      1.0.4
// @description  Customized browser tomato timer
// @author       https://github.com/LDY681
// @match        *://*/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_notification
// @updateURL    https://github.com/LDY681/Tomato-Timer-UserScript/raw/main/timer.user.js
// @downloadURL  https://github.com/LDY681/Tomato-Timer-UserScript/raw/main/timer.user.js
// @noframes
// ==/UserScript==

/**
 * @property time // last notified timestamp
 * @property pomodoro // pomodoro settings in seconds
 * @property shortBreak // shortBreak settings in seconds
 * @property longBreak // longBreak settings in seconds
 * @property pomodoroCounter // counter for Pomodoro technique. count increases with every pomodoro followed by one short break, reset with every 4 pomodoros and starts a long break
 */
 (() => {
  // Initialize buffer
  initialize();

  // Start the timer
  setInterval(timer, 5000);
})();

async function initialize() {
  // Initialize timestamp if it doesn't exist
  let timestamp = await GM.getValue('time');
  if (typeof timestamp == "undefined") {
    GM.setValue("time", currTime());
  }

  // Initialize timer settings if it doesn't exist, default set to (25 mins + 5mins + 10 mins)
  let pomodoro = await GM.getValue('pomodoro');
  let shortBreak = await GM.getValue('shortBreak');
  let longBreak = await GM.getValue('longBreak');
  if (typeof pomodoro == "undefined") {
    GM.setValue("pomodoro", 25 * 60);
  }
  if (typeof shortBreak == "undefined") {
    GM.setValue("shortBreak", 5 * 60);
  }
  if (typeof longBreak == "undefined") {
    GM.setValue("longBreak", 10 * 60);
  }

  // Initialize counter
  let pomodoroCounter = await GM.getValue('pomodoroCounter');
  if (typeof pomodoroCounter == "undefined") {
    GM.setValue("pomodoroCounter", 0);
  }

  // Initialize current stage (pomodoro, short break, long break)
  let stage = await GM.getValue('stage');
  if (typeof stage == "undefined") {
    GM.setValue("stage", 'pomodoro');
  }
}

// Timer
async function timer() {
  // Run only in current active tab to avoid concurrency
  if (document.visibilityState != 'hidden') {
    let stage = await GM.getValue('stage'); // get stage we are currently on
    let gracePeriod = await GM.getValue(stage); // get grace period for this stage
    // If hasn't notified for ${pomodoro} seconds
    let timestamp = await GM.getValue('time');
    let now = currTime();
    if (now - timestamp >= gracePeriod) {
      // Update last notified time
      GM.setValue("time", currTime());
      notify();
    }
  }
}

// Convert time to seconds
function currTime() {
  return Math.round(new Date().getTime() / 1000);
}

// Notify
async function notify() {
  let {stage, pomodoroCounter} = await getNextStage();
  GM_notification({
    title: "Tomato Timer(Click Me to change settings)",
    text: "Time for another " + stage + "!",
    image: 'https://img1.baidu.com/it/u=458436129,1300053544&fm=26&fmt=auto&gp=0.jpg',
    timeout: 0, // Don't disappear
    ondone: async function() {
      // update phase to next one
      setTimeout(async ()=>{
        let {stage, pomodoroCounter} = await getNextStage(); // get stage info again in case it was updated onclick
        updateStage(stage, pomodoroCounter);
      }, 1000);
    },
    onclick: async function() {
      var option = prompt("Customize timer: 1.\nSkip to next phase: 2.\nReset timer: 3.")
      if (option != null && option != ""){
        if (option == '1') {
          var settings = prompt("Set Custom Times in the following order: pomodoro + short break + long break.\nEach follows by space(in mins).");
          if (settings != null && settings != ""){
            let settingsArrs = settings.split(" ");
            let pomodoro = settingsArrs[0] || 25;
            let shortBreak = settingsArrs[1] || 5;
            let longBreak = settingsArrs[2] || 10;
            GM.setValue("pomodoro", pomodoro * 60);
            GM.setValue("shortBreak", shortBreak * 60);
            GM.setValue("longBreak", longBreak * 60);
          }
        } else if (option == '2') {
          let {stage, pomodoroCounter} = await getNextStage();
          updateStage(stage, pomodoroCounter)
        } else if (option == '3') {
          GM.setValue("pomodoro", 25 * 60);
          GM.setValue("shortBreak", 5 * 60);
          GM.setValue("longBreak", 10 * 60);
          stage = 'pomodoro';
          pomodoroCounter = 0;
        }
      }
    }
  });
}

// Get next stage
async function getNextStage(Stage, PomodoroCounter) {
  let stage = Stage || await GM.getValue('stage'); // get stage we are currently on
  let pomodoroCounter = PomodoroCounter || await GM.getValue('pomodoroCounter'); // get pomodoroCounter
  // Update stage and counter to next phase
  if (stage == 'pomodoro') {
    // change stage to break
    if (pomodoroCounter == 3) {
      // long break
      stage = 'longBreak';
      pomodoroCounter = 0;
    } else {
      // short break
      stage = 'shortBreak';
    }
  } else {
    // change stage to pomodoro and update counter
    stage = 'pomodoro';
    ++pomodoroCounter;
  }

  return Promise.resolve({stage, pomodoroCounter});
}

// Update to next stage
async function updateStage(stage = 'pomodoro', pomodoroCounter = 0) {
  GM.setValue("time", currTime());
  GM.setValue("stage", stage);
  GM.setValue("pomodoroCounter", pomodoroCounter);
}