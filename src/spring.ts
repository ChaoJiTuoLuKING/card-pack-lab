// Damped spring integrator from prism-holo-pack (MIT).
export class SpringValue {
  x: number;
  to: number;
  v = 0;
  k = 0;
  c = 0;
  constructor(initial = 0, response = 0.5, bounce = 0) {
    this.x = initial;
    this.to = initial;
    this.v = 0;
    this.configure(response, bounce);
  }
  configure(response: number, bounce = 0) {
    const omega = (2 * Math.PI) / response;
    this.k = omega * omega;
    this.c = (4 * Math.PI * (1 - bounce)) / response;
    return this;
  }
  step(dt: number) {
    this.v += (this.k * (this.to - this.x) - this.c * this.v) * dt;
    this.x += this.v * dt;
  }
}
