class PlayerFeature {
  constructor({ name }) {
    this.name = name;
  }
}

const AutoPlayFeature = new PlayerFeature({
  name: "autoplay",
  warning: ""
});
