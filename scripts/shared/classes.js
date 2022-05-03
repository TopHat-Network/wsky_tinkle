const modsThatAreToggleable = [18, 22];
const tyreModIds = [23, 24];

class TinkleVehicle {
  _uuid = null;
  _name = '';
  _model = '';
  _ownerId = null;
  _licensePlate = '';
  _colors = {};
  _mods = {};
  _styles = {};
  _extras = [];
  _windowTint = -1;
  _bulletProofTyres = false;

  resetValues() {
    this._uuid = null;
    this._name = '';
    this._model = '';
    this._ownerId = null;
    this._licensePlate = '';
    this._colors = {};
    this._mods = {};
    this._styles = {};
    this._extras = [];
  }

  constructor(data) {
    if (data) {
      this._uuid = data.id;
      this._name = data.name;
      this._model = data.model;
      this._ownerId = data.userId;
      this._licensePlate = data.licensePlate;
      this._colors = data.colors;
      this._mods = data.mods;
      this._styles = data.styles;
      this._extras = data.extras;
    }
  }

  setName(name) {
    this._name = name;
  }

  fromGTAVehicle(vehicle) {
    const [primary, secondary] = GetVehicleColours(vehicle);
    const [pearlescent, wheelColor] = GetVehicleExtraColours(vehicle);

    this._model = GetDisplayNameFromVehicleModel(GetEntityModel(vehicle));
    this._colors = {
      primary,
      secondary,
      pearlescent,
      wheelColor
    };

    // Get vehicle mods
    for (let i=0; i<67; i++) {
      if (modsThatAreToggleable.includes(i)) {
        this._mods[i] = !!IsToggleModOn(vehicle, i);
      } else {
        const modValue = GetVehicleMod(vehicle, i);
        if (modValue !== -1) this._mods[i] = modValue;
      }

      if (tyreModIds.includes(i)) {
        this._styles[i] = GetVehicleModVariation(vehicle, i);
      }
    }

    this._windowTint = GetVehicleWindowTint(vehicle);
    this._bulletProofTyres = !GetVehicleTyresCanBurst(vehicle);

    for (let i=0; i<=20; i++) {
      if (IsVehicleExtraTurnedOn(vehicle, i)) this._extras.push(i);
    }

    return this;
  }

  convertToTinkleObject() {
    return {
      name: this._name,
      model: this._model,
      mods: this._mods,
      colors: this._colors,
      styles: this._styles,
      extras: this._extras,
      windowTint: this._windowTint,
      bulletProofTyres: this._bulletProofTyres
    }
  }
}