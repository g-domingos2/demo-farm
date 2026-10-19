// =====================================================================
//  Física de cada quadro: giro/pressurização dos pivôs, pulsos de água
//  nas tubulações e atualização do painel lateral
// =====================================================================
import { SPEED_FACTOR } from './config.js';
import { pumpState } from './ui/pump-panel.js';
import { refreshPivotPanel } from './ui/pivot-panel.js';

const RAMP_UP_TIME = 7;   // s até o motor "pegar" a velocidade cheia depois de ligar — pivô real usa partida suave (soft starter) pra não dar tranco na estrutura, não sai já na marcha máxima

export function createSimulation({ pivots, ripple, ripple2 }) {
  let rippleT = 0, rippleT2 = 0;

  function update(dt, t) {
    const pumpOn = pumpState.on;

    // cada pivô gira de forma independente, conforme seu estado (modal de operação)
    for (const pv of pivots) {
      // pressurização: em modo molhado, o cano enche do centro à ponta enquanto a bomba está ligada;
      // sem bomba (ou em modo seco) ele drena de volta a 0. O pivô só gira molhado com o cano cheio.
      const fillTarget = (pv.active && pv.wet && pumpOn) ? 1 : 0;
      const fillDiff = fillTarget - pv.fillProgress;
      pv.fillProgress = Math.max(0, Math.min(1, pv.fillProgress + Math.sign(fillDiff) * Math.min(Math.abs(fillDiff), dt / 3)));
      const pressurized = !pv.wet || pv.fillProgress >= 1;

      if (pv.active && pressurized) {
        // partida suave: motor "acelera" até a velocidade cheia em vez de já nascer nela
        pv.ramp = Math.min(1, pv.ramp + dt / RAMP_UP_TIME);
        const rampSpeed = pv.ramp * pv.ramp * (3 - 2 * pv.ramp);   // smoothstep — acelera e suaviza a chegada na velocidade cheia

        const prev = pv.angle;
        pv.angle += pv.dir * 0.14 * SPEED_FACTOR * pv.speedMul * (pv.pct / 100) * rampSpeed * dt;   // rad/s (escala de demo)
        const step = Math.abs(pv.angle - prev);
        pv.swept += step;
        if (pv.swept >= Math.PI * 2 * (pv.laps + 1)) pv.laps++;
        // rotation.y positivo gira o braço no sentido anti-horário (visto de cima);
        // invertido aqui para o avanço (dir=1) ser sempre horário, como um pivô real
        pv.arm.rotation.y = -pv.angle;
        // rodas rolam no chão: giram proporcional ao avanço (sentido acompanha dir;
        // sinal negativo pra rolagem casar com o sentido de marcha do braço)
        const dA = pv.angle - prev;
        for (const w of pv.spinners) w.rotation.z -= dA * w.userData.wheelSpin;
        // rastro no chão: véu azul bem leve onde irrigou de verdade (a opacidade
        // é fixa na camada — ver WET_VEIL no pivot.js); sem pintura ao girar a seco
        if (pumpOn && pv.wet) {
          pv.paint(Math.min(pv.angle, prev), Math.max(pv.angle, prev), 'rgb(80,170,255)');
          pv.wetSwept += step;
        }

        const deg = ((pv.angle * 180 / Math.PI) % 360 + 360) % 360;
        const stepDeg = step * 180 / Math.PI;
        if (pv.stopAngle !== null) {
          const diff = Math.abs(((deg - pv.stopAngle + 540) % 360) - 180);
          if (diff <= stepDeg + 0.05) { pv.active = false; pv.finished = true; pv.stopAngle = null; }
        }
        if (pv.stopLaps !== null && pv.laps >= pv.stopLaps) { pv.active = false; pv.finished = true; pv.stopLaps = null; }

        // alerta simulado: enquanto operando, chance pequena por segundo de soar um alarme passageiro
        if (t >= pv.alertUntil && Math.random() < 0.006 * dt) pv.alertUntil = t + 8;
      } else {
        pv.ramp = 0;   // reseta a rampa — próxima vez que ligar, acelera de novo desde o início
      }

      // só borrifa água se o cano já estiver pressurizado (bomba ligada + modo molhado)
      if (pv.active && pv.wet && pumpOn && pv.fillProgress >= 1) {
        pv.updateSpray(dt);   // gotas saem dos bocais e caem em parábola (entities/pivot.js)
        pv.dropMat.opacity = Math.min(0.8, pv.dropMat.opacity + dt * 1.5);
      } else if (pv.dropMat.opacity > 0) {
        pv.dropMat.opacity = Math.max(0, pv.dropMat.opacity - dt * 2.5);
      }
    }

    if (pumpOn) {
      // ondulação nos pontos de captação
      rippleT = (rippleT + dt * 0.8) % 1;
      ripple.scale.setScalar(1 + rippleT * 3.5);
      ripple.material.opacity = 0.5 * (1 - rippleT);
      ripple.visible = true;
      rippleT2 = (rippleT2 + dt * 0.8) % 1;
      ripple2.scale.setScalar(1 + rippleT2 * 3.5);
      ripple2.material.opacity = 0.5 * (1 - rippleT2);
      ripple2.visible = true;
    } else {
      ripple.visible = false;
      ripple2.visible = false;
    }

    // painel: atualiza o card de cada pivô
    refreshPivotPanel(pivots, dt, t, pumpOn);
  }

  return { update };
}
