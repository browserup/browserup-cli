export class WaitStrategy {
  initialize(delay_sec, retries, max_elapsed_time_sec) {
    this.delay_sec = delay_sec;
    this.retries = retries;
    this.max_elapsed_time_sec = max_elapsed_time_sec;
  }
}
