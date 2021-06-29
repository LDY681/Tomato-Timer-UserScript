// ==UserScript==
// @name         Tomato Timer
// @version      1.0.2
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
    let gracePeriod = await GM.getValue(stage);  // get grace period for this stage 
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
function notify() {
  GM_notification({
    title: "Tomato Timer",
    text: "Click to settings",
    image: 'https://img1.baidu.com/it/u=458436129,1300053544&fm=26&fmt=auto&gp=0.jpg',
    timeout: 0, // Don't disappear
    ondone: async function() {
      // update last timestamp
      GM.setValue("time", currTime());
      // change stage to next one
      let stage = await GM.getValue('stage'); // get stage we are currently on
      let pomodoroCounter = await GM.getValue('pomodoroCounter');
      console.log("stage: " + stage + " pomodoroCounter: " + pomodoroCounter);
      if (stage == 'pomodoro') {
        // change stage to break
        if (pomodoroCounter == 3) {
          // long break
          GM.setValue("stage",'longBreak');
          GM.setValue("pomodoroCounter", 0);
        } else {
          // short break
          GM.setValue("stage",'shortBreak');
        }
      } else {
        // change stage to pomodoro and update counter
        GM.setValue("stage",'pomodoro');
        GM.setValue("pomodoroCounter", ++pomodoroCounter);
      }
    },
    onclick: function() {
      var options = prompt("Set Custom Times in the following order: pomodoro + short break + long break.\n Each follows by space(in mins).")
      if (options!=null && options!=""){
        let optionArrs = options.split(" ");
        let pomodoro = optionArrs[0] || 25;
        let shortBreak = optionArrs[1] || 5;
        let longBreak = optionArrs[2] || 10;
        GM.setValue("pomodoro", pomodoro * 60);
        GM.setValue("shortBreak", shortBreak * 60);
        GM.setValue("longBreak", longBreak * 60);
      }
      GM.setValue("time", currTime());
    }
  });
}