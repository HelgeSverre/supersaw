// waveformUtils.js

export async function generateWaveform(url, samples = 1000) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const rawDataLeft = audioBuffer.getChannelData(0);
  const rawDataRight =
    audioBuffer.numberOfChannels > 1
      ? audioBuffer.getChannelData(1)
      : rawDataLeft;
  const blockSize = Math.floor(rawDataLeft.length / samples);
  let waveformPoints = [];

  for (let i = 0; i < samples; i++) {
    let maxLeft = 0,
      maxRight = 0,
      minLeft = 0,
      minRight = 0;
    for (let j = 0; j < blockSize; j++) {
      const idx = i * blockSize + j;
      maxLeft = Math.max(maxLeft, rawDataLeft[idx]);
      maxRight = Math.max(maxRight, rawDataRight[idx]);
      minLeft = Math.min(minLeft, rawDataLeft[idx]);
      minRight = Math.min(minRight, rawDataRight[idx]);
    }
    waveformPoints.push({
      max: Math.max(maxLeft, maxRight),
      min: Math.min(minLeft, minRight),
    });
  }

  // Generate SVG path data for the full waveform
  let upperPathData = "M 0 50 ";
  let lowerPathData = "M 0 50 ";
  waveformPoints.forEach((point, i) => {
    const x = (i / samples) * 100; // Scale X based on sample count (percentage)
    const upperY = 50 - point.max * 50; // Scale upper Y based on max amplitude
    const lowerY = 50 - point.min * 50; // Scale lower Y based on min amplitude

    upperPathData += `L ${x} ${upperY} `;
    lowerPathData += `L ${x} ${lowerY} `;
  });

  // Close the path shapes
  upperPathData += "L 100 50";
  lowerPathData += "L 100 50";

  return upperPathData + lowerPathData;
}

export async function generateSVGWaveform(url, samples = 512) {
  // Fetch the audio file
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();

  // Decode the audio data
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioData = await audioContext.decodeAudioData(arrayBuffer);

  // Analyze the audio data to get the waveform
  const channelCount = audioData.numberOfChannels;
  const sampleRate = audioData.sampleRate;
  const length = audioData.length;
  const data = audioData.getChannelData(0);

  const step = Math.ceil(length / samples); // Adjust this to change the detail of the waveform
  const amplitudes = [];

  for (let i = 0; i < length; i += step) {
    const min = Math.min(...data.slice(i, i + step));
    const max = Math.max(...data.slice(i, i + step));
    amplitudes.push(min, max);
  }

  // Create an SVG path from the waveform data
  let path = `M0 ${amplitudes[0] * 100} `;

  for (let i = 1; i < amplitudes.length; i++) {
    path += `L${i} ${amplitudes[i] * 100} `;
  }

  return path;
  // Create and return the SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${2 * amplitudes.length} 256`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "256");

  const svgPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  svgPath.setAttribute("d", path);
  svgPath.setAttribute("fill", "none");
  svgPath.setAttribute("stroke", "black");

  svg.appendChild(svgPath);

  return svg;
}

export async function generateWaveformSVG(
  url,
  svgWidth = 500,
  svgHeight = 100,
) {
  // Create an audio context
  const audioContext = new AudioContext();

  // Fetch the audio file and decode its data
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Assuming stereo audio; get data for both channels
  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = audioBuffer.getChannelData(0);

  // Calculate wave data (simplified for brevity)
  const step = Math.ceil(leftChannel.length / svgWidth);
  const amp = 100;
  let pathD = "M0 " + amp;

  for (let i = 0; i < svgWidth; i++) {
    // Average the samples to reduce to one value per pixel
    let min = 1.0;
    let max = -1.0;
    for (let j = 0; j < step; j++) {
      const sampleIndex = i * step + j;
      if (sampleIndex < leftChannel.length) {
        const sample =
          (leftChannel[sampleIndex] + rightChannel[sampleIndex]) / 2; // Averaging stereo channels
        min = Math.min(min, sample);
        max = Math.max(max, sample);
      }
    }
    // SVG Y coordinates are flipped, so max comes before min
    pathD +=
      " L" +
      (i + 1) +
      " " +
      (amp - max * amp) +
      " L" +
      (i + 1) +
      " " +
      (amp - min * amp);
  }

  // Close the path back at the bottom middle for mirrored effect

  return pathD;

  // Create an SVG element and set its path
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathD);
  path.setAttribute("stroke", "black");
  path.setAttribute("fill", "none");

  svg.appendChild(path);

  // Return the SVG element
  return svg;
}
