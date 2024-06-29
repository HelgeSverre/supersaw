export class XM {
  protected data: ArrayBuffer;

  private idText: string;
  private moduleName: string;
  private magic: number;
  private trackerName: string;
  private versionNumber: any;
  private songLength;
  private songRestartPosition;
  private numChannels: number;
  private numPatterns: number;
  private numInstruments: number;
  private amigaFreqTable: boolean;
  private linearFreqTable: boolean;
  private tempo: number;
  private bpm: number;

  constructor(data: ArrayBuffer) {
    this.data = data;
  }

  readBytes(start: number, length: number) {
    return new Uint8Array(this.data.slice(start, start + length));
  }

  readWord(start: number): number {
    const dv = new DataView(this.data);
    return dv.getUint16(start, true); // true for little-endian
  }

  formatVersion(version): string {
    const major = (version >> 8) & 0xff;
    const minor = version & 0xff;
    return `${major}.${minor.toString().padStart(2, "0")}`;
  }

  debug() {
    const dv = new DataView(this.data);
    const d = new TextDecoder();

    this.idText = d.decode(this.readBytes(0, 17));
    this.moduleName = d.decode(this.readBytes(17, 20));
    this.magic = dv.getUint8(37);
    this.trackerName = d.decode(this.readBytes(38, 20)).trim();
    this.versionNumber = this.formatVersion(dv.getUint16(58));

    const headerOffset = 60;
    const headerSize = dv.getUint32(headerOffset, true);

    this.songLength = dv.getUint16(headerOffset + 4, true);
    this.songRestartPosition = dv.getUint16(headerOffset + 6, true);
    this.numChannels = dv.getUint16(headerOffset + 8, true);
    this.numPatterns = dv.getUint16(headerOffset + 10, true);
    this.numInstruments = dv.getUint16(headerOffset + 12, true);

    const flag = dv.getUint16(headerOffset + 14, true);
    this.amigaFreqTable = ((flag >> 8) & 0xff) == 0;
    this.linearFreqTable = ((flag >> 8) & 0xff) == 1;

    this.tempo = dv.getUint16(headerOffset + 16, true);
    this.bpm = dv.getUint16(headerOffset + 18, true);
    const patternOrderTable = new DataView(this.data.slice(headerOffset + 20, headerOffset + 20 + 256));

    const offset = headerOffset + 20 + 256;
    const patternLength = dv.getUint32(offset, true);
    const packingType = dv.getUint8(offset + 4);
    const numRows = dv.getUint16(offset + 5, true);
    const packedSize = dv.getUint16(offset + 7, true);
    const patternData = new DataView(this.data.slice(offset + 9, packedSize));
    console.log({
      patternLength,
      packingType,
      numRows,
      packedSize,
      patternData,
    });
  }
}
