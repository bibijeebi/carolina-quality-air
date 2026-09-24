---
title: Air compressors
description: What feeds the whips, skipper balls, and air washers. How each type squeezes air, how to size one, and what breaks.
sidebar:
  order: 1
---

Every air tool on a CQA job runs off a compressor. The compressor on the truck **supplies air**. It does not pull. The pulling is done by the [HyperVac](/kb/gear/vacuum/hypervac/) or the [gas vac](/kb/gear/vacuum/meyer-gas-vac/). Mixing those two up is the most common way to describe the job wrong.

<dl class="facts">
<dt>Job</dt><dd>Supplies compressed air to whips, skipper balls, forward nozzles, air washers, and the siphon sprayer.</dd>
<dt>Spec that matters</dt><dd>CFM at a stated psi, e.g. "11.5 CFM @ 90 psi". Horsepower and tank size are marketing.</dd>
<dt>Tank</dt><dd>A buffer only. A big tank on a weak pump still starves a whip.</dd>
<dt>Kills it</dt><dd>Running flat out past its duty cycle, long skinny extension cords, never draining the tank.</dd>
</dl>

## The types, by how they squeeze

| Type | How it works | Where you see it |
|---|---|---|
| Single-stage piston | A piston in a cylinder, like an engine. Thin steel reed valves let air in and out. Tops out around 125 to 150 psi. | Pancakes, hot dogs, twin-stacks, wheelbarrows. Most of the broken pile. |
| Two-stage piston | A big cylinder compresses, a finned intercooler cools it, a small cylinder compresses again. Around 175 psi. | Big stationary shop units, truck-mounted units. |
| Rotary screw | Two meshing corkscrew rotors squeeze air continuously in an oil bath. Built to run all day. | Towable diesel units (100 to 185 CFM class), industrial shop air. |
| Rotary vane | Off-center rotor with sliding vanes. Each cell shrinks as it turns. | Some truck-mounted and underhood units. |
| Scroll | One spiral orbits inside a fixed one, walking air pockets inward. | Oil-free lab and dental air. Rare for us. |

:::tip[Screw vs scroll]
**Screw is a corkscrew. Scroll is a cinnamon roll.** On a CQA job, "screw" means a big air source. "Scroll" means you're looking at the customer's AC condenser.
:::

## Sizing: can this compressor run this tool?

Nobody on the tool side publishes per-tool CFM. Nikro, Rotobrush, Viper, and Abatement list whips and skipper lines with no CFM figure, so the numbers below come from compressor sellers and are marketing-grade, not neutral.

| Source | Claim |
|---|---|
| Scand Tech | "Industry standard" low-volume tools run 15 to 25 CFM at 175 to 250 psi. High-volume nozzles run 40 to 185 CFM at 90 to 120 psi, with 100 to 185 CFM tow-behinds recommended. |
| Compressed Air Systems | Residential and light commercial duct cleaning: 50 to 60 CFM at 100 to 150 psi to run several whips or long skipper lines. |
| Nikro compressor line (via dealer) | 4.5 CFM @ 90 (115 V portable) up to 24 CFM @ 90 (13 HP truck mount, 80 gal twin tank). |

Practical read: a 115 V portable runs one light tool at a time, and not all day. Two whips at once or a long skipper line wants a truck-mounted or tow-behind unit.

**Duty cycle.** Cheap piston units want roughly half on, half off. Duct work runs them flat out, which is why they die. A screw compressor is the only type built for 100% duty.

## Symptom to fix

| Symptom | Check first |
|---|---|
| Hums, won't start | Start capacitor, or burnt pressure switch contacts. Also a failed unloader or check valve making the motor start against full head pressure. |
| Short hiss after shutoff | Normal. That's the unloader dumping head pressure. |
| Constant hiss from the pressure switch | Check valve leaking back from the tank. |
| Trips the breaker | Voltage drop from a long or skinny extension cord. Use a short 12-gauge cord and run more air hose instead. |
| Runs forever, never builds pressure | Soapy-water the fittings first. Then a broken reed valve, blown head gasket, or worn rings. |
| Leaks down overnight | Check valve, tank drain, or fittings. |
| Spits water | Nobody drained the tank. |
| Oiled unit seized | Ran low or on the wrong oil. Use compressor oil, not motor oil. |
| Rust or pinholes in the tank | **Scrap the tank.** Never weld or patch a pressure vessel. |

## Daily care

1. Drain the tank at the end of the day. Water in the tank rots it from the inside.
2. Check oil on oiled units.
3. Pull the safety valve ring and let it pop. A seized pop-off is how a tank bursts.
4. Short heavy cord, long air hose.
5. Never point air at skin.

:::caution[Safety relief valve]
The shop compressor ran with a dead pop-off in August 2026. The fix is a 1/4 NPT, 175 psi, ASME-stamped relief valve, about $10. See [repair WO-001](/repairs/2026-08-22).
:::

## Sources

- [Scand Tech: high volume vs high pressure](https://www.scandtechusa.com/pages/high-volume-vs-high-pressure)
- [Compressed Air Systems: duct and dryer vent cleaning](https://www.compressedairsystems.com/application/professional-air-duct-and-dryer-vent-cleaning-solutions/)
- [Spycor: Nikro portable compressors](https://spycor.com/blog/nikro-portable-air-compressors-buy-for-duct-cleaning-power/)
- [Nikro compressed air cleaning tools](https://www.nikro.com/products/air-duct-cleaning-equipment-supplies/compressed-air-cleaning-tools)
