class ModulationMatrix {
  constructor() {
    this.connections = [];
  }

  connect(source, destination, modulationFunction) {
    const connection = { source, destination, modulationFunction };
    this.connections.push(connection);
    this.start();
  }

  update() {
    this.connections.forEach((conn) => {
      const modValue = conn.source.getValue();
      conn.modulationFunction(modValue, conn.destination);
    });

    requestAnimationFrame(this.update.bind(this));
  }

  start() {
    requestAnimationFrame(this.update.bind(this));
  }
}

export default ModulationMatrix;
