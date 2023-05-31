import ora from "ora";

// Abstraction over spinner implementation
export class LogSpinner {
  static spinner = undefined

  static start(status) {
    const spinner = this.#getSpinner()
    spinner.text = status
    spinner.start()
  }

  static update(status) {
    this.#getSpinner().text = status
  }

  static stop() {
    this.#getSpinner().stop()
  }

  static #getSpinner() {
    if (this.spinner === undefined) {
      this.spinner = ora({
        text: "",
        spinner: "dots",
        discardStdin: false
      })
    }
    return this.spinner;
  }
}
