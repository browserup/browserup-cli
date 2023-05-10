import ora from 'ora';

export class LogSpinner {
  static get() {
    {
      if (!this.spinner) {
        this.spinner = new LogSpinner();
      }
      return this.spinner;
    }
  }

  constructor() {
    this.spinner = null;
  }

  logWithSpinner(status) {
    this.spinner = ora({
      text: status,
      spinner: 'dots',
      discardStdin: false
    }).start();
  }

  isSpinnerActive() {
    return this.spinner && this.spinner.isSpinning;
  }

  updateLogSpinner(status) {
    if (this.spinner) {
      this.spinner.text = status;
    }
  }

  stopLogSpinner() {
    if (this.spinner) {
      this.spinner.stop();
    }
  }
}
