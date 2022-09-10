import { generatedGLSLToMinimalRenderer } from 'shader-park-core';
import { preval } from 'babel-plugin-preval'

const canvas = document.querySelector('.my-canvas');

const spCode = `
// Options =============================================================

const numParticles = 12;
const maxSteps = 9;
const skipPercent = 30;
const randomMovePercent = 30;
const slowness = 15;
let randomSeed = 4456.62;

// Helpers =============================================================

const random = () => {
    const x = Math.sin(randomSeed++) * 10000;
    return x - Math.floor(x);
};

const getDistance = (pos1, pos2) => {
    return Math.sqrt(
        (pos1[0] - pos2[0])**2 +
        (pos1[1] - pos2[1])**2 +
        (pos1[2] - pos2[2])**2
    );
};

const scoreMove = (move, particleIndex) => {
    const particle = particles[particleIndex];
    const position = particle.position.map((v, i) => v + move[i]);
    const distances = particles
        .filter((_, i) => i !== particleIndex)
        .map((p) => getDistance(p.position, position));
    const minDistance = Math.min(...distances);
    const sumDistance = distances.reduce((a, b) => a + b, 0);
    return 99999 * minDistance + sumDistance;
};

const getMove = (particleIndex) => {
    let bestMove = null;
    let bestMoveScore = -Infinity;
    for (const move of moveOptions) {
        const score = scoreMove(move, particleIndex);
        if (score > bestMoveScore) {
            bestMove = move;
            bestMoveScore = score;
        }
    }
    return bestMove;
};

// Pre-determining moves ===============================================

const moveOptions = [
    [1, 0, 0], [0, 1, 0], [0, 0, 1],
    [-1, 0, 0], [0, -1, 0], [0, 0, -1],
];

const particles = [];
for (let i = 0; i < numParticles; i++) {
    particles.push({
        moves: [],
        position: [0, 0, 0]
    });
}

for (let i = 0; i < maxSteps; i++) {
    for (let j = 0; j < numParticles; j++) {
        const particle = particles[j];

        const isSkip = random() < (skipPercent / 100);
        if (isSkip) {
            continue;
        }

        let move;
        const isRandom = random() < (randomMovePercent / 100);
        if (isRandom) {
            const moveIndex = Math.floor(random() * moveOptions.length);
            move = moveOptions[moveIndex];
        } else {
            move = getMove(j);
        }
        particle.moves.push(move);
        particle.position = particle.position.map((v, i) => v + move[i]);
    }
}

// Animations ==========================================================

const tLinear = mod(time, slowness);
const t = min(2 / slowness * tLinear, -2 / slowness * tLinear + 2);

for (const particle of particles) {
    const moves = particle.moves;

    for (let i = 0; i < moves.length; i++) {

        const move = moves[i];
    
        const start = i / moves.length;
        const end = (i + 1) / moves.length;
        
        const tLocal = (min(max(start, t), end) - start) / (end - start);
        const distance = ncos(tLocal * PI + PI) / moves.length;
    
        let [x, y, z] = move;
        x *= distance;
        y *= distance;
        z *= distance;
        displace(x, y, z);
    }

    color(161/255, 228/255, 242/255);
    lightDirection(ncos(time), nsin(time), ncos(time));
    shine(1.16);
    sphere(0.08);
    blend(0.3);
    reset();
}
`;

// This converts your Shader Park code into a GLSL shader at build time
const output = preval`
const shaderPark = require('./node_modules/shader-park-core/dist/shader-park-core.cjs.js');
module.exports = shaderPark.sculptToGLSL(\`${spCode}\`);`;

// This sets up a WebGL context for and 
generatedGLSLToMinimalRenderer(canvas, output);