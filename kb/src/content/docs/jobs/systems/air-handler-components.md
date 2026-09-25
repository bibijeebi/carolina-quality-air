---
title: "Air handler components"
description: "The airflow path through an air handler, what each section does, what gets dirty, what CQA cleans, and where to be careful."
sidebar:
  order: 2
---
The air handler (AHU) is the box that moves the air. ACR defines it as "a packaged assembly, usually connected to ductwork, that moves air and may also clean and condition the air." A residential air handler, a furnace with a coil on top, a rooftop unit, and a mechanical-room AHU are all the same idea at different sizes. Learn the sections once and you can find them in any cabinet.

<dl class="facts">
<dt>What ACR counts as the system</dt><dd>Return grilles and ducts, the AHU and its interior, mixing box, coil compartment, drain pans, humidifiers, fans, filters, reheat coils, supply ducts and diffusers.</dd>
<dt>Not the system</dt><dd>Non-ducted ceiling plenums (ACR definitions).</dd>
<dt>AHU inspection list</dt><dd>Filters and air bypass, coils, condensate pans and drain lines, humidification, acoustic insulation, fans, dampers, door gaskets, unit integrity (ACR 1.7.1).</dd>
<dt>When we clean it</dt><dd>Last, after both duct sides. See <a href="/kb/jobs/procedures/clean-the-air-handler/">Clean the air handler</a>.</dd>
</dl>

## The path, in order

A typical commercial draw-through unit, return side to supply side:

| # | Section | What it does |
|---|---|---|
| 1 | **Return air** | Room air coming back through the return duct or ceiling plenum |
| 2 | **Outside air intake and mixing box** | Outside air (OA) damper and return air (RA) damper meet here. The blend is "mixed air." A relief damper dumps extra air outside. With an economizer, the dampers modulate to cool with outside air when that takes less energy. |
| 3 | **Filters** | Protect everything downstream. Rack, frames, and seals matter as much as the media. |
| 4 | **Preheat coil** (cold climates, high-OA units) | Warms cold intake air ahead of the cooling coil |
| 5 | **Cooling coil** | Cools and dehumidifies. Wet in cooling season. |
| 6 | **Drain pan, trap, float switch** | Catches condensate off the cooling coil and carries it away |
| 7 | **Blower (fan)** | Moves all the air. On a draw-through unit it sits after the coil and pulls. |
| 8 | **Heating section** | Hot water coil, gas heat exchanger, or electric heat strips |
| 9 | **Humidifier** (some units) | Adds moisture, usually steam through a dispersion tube, sometimes a wetted pad |
| 10 | **Supply plenum / discharge** | Into the supply trunk |

**Mnemonic, return to supply: "Ricky Makes Fresh Coffee, Pours Big Hot Servings."** Return, Mixing box, Filter, Coil, Pan, Blower, Heat, Supply. Humidifier and reheat hang off the back end when they exist.

The order moves around. That is normal:

- **Draw-through vs blow-through.** Draw-through: fan after the coil, pulling. Blow-through: fan before the coil, pushing. Marlo Coil: most evaporator coils are placed so the air is drawn through them. On a draw-through unit the drain pan sits under **negative** pressure, so the trap has to be deep enough to hold a water seal against the fan, or air gets pulled up the drain and water backs up into the unit.
- **Upflow gas furnace with a split AC.** Filter at the return, blower at the bottom, heat exchanger in the middle, evaporator coil in its own box on top in the supply plenum. See [Split systems and heat pumps](/kb/jobs/systems/split-systems-and-heat-pumps/).
- **Residential heat pump air handler.** Coil at the air entry, blower pulling through it, heat strips at the blower discharge. _(typical layout, check the unit)_
- **Rooftop unit.** Everything in one cabinet, often with an economizer hood on the outside air end. See [Rooftop unit and VAV](/kb/jobs/systems/rooftop-unit-and-vav/) and [Package unit](/kb/jobs/systems/package-unit/).

Filter first is the rule on every layout. If you find a unit where dirty return air hits the coil before any filter, or the filter is missing, that is a finding.

## Section by section

| Section | What gets dirty | What CQA does | Cautions |
|---|---|---|---|
| Return plenum | Everything the returns carry. Always gross. | Cleaned with the return side. Often our 8 inch access and vac point on residential. | Plenum may be duct board. Porous rules apply. See [Duct board and lined duct](/kb/jobs/systems/duct-board-and-lined-duct/). |
| OA intake, louver, bird screen | Leaves, feathers, nests, cottonwood | Note screen condition. Intake is not the loop we clean unless scoped. | Motorized OA damper: mark and restore position (ACR 4.8). |
| Mixing box, economizer dampers | Dust on blades and linkage, return debris | Clean with the unit. Mark damper positions first. | Do not force or bend linkage. A stuck economizer wastes energy both seasons (PNNL). Report it. |
| Filter rack | Dust bypass around loose or wrong-size filters | **New filters are part of the air handler job.** Check fit, frames, gaskets. | Dust downstream of a clean filter means bypass. ACR lists "filters and air bypass" in the AHU inspection. |
| Cooling coil | Dust caked onto wet fins, biofilm, mold. Fins bend. | Spray enzymatic coil cleaner, let it work. Degreaser, diluted, for greasy coils. See [Coil cleaner and pump sprayer](/kb/gear/wash/coil-cleaning/). | Both faces of the coil need access (ACR 4.11). pH as close to neutral as possible. No pressure washer on fins. Static pressure drop before and after proves it worked (ACR 4.11.6). |
| Drain pan and line | Standing water, slime, sludge, rust | Look **before** you spray. Photograph growth. Wet cleaning means pan and line cleaned, flushed, drainage tested before and after (ACR 4.11.4.1). | EPA: "substantial standing water and/or debris indicates a problem requiring immediate attention." Do not knock the float switch out of position. |
| Blower wheel and housing | Dust packed into the cupped blades of the squirrel cage, housing walls | Standard clean: wipe the housing in place. Blower does not come out for a standard clean. | **Power off and locked out.** Build-up on fan blades cuts efficiency and airflow and can unbalance the wheel (DOE fan sourcebook). |
| Heating section | Dust on strips and exchanger | Heat exchanger checked visually (EPA checklist item). Heat strips: dry method or non-corrosive detergent only. | Electric strips: de-energize, lock out, rinse free of chemical, dry before re-energizing (ACR 4.11.8). A rusted or cracked exchanger is a finding, not our repair. |
| Humidifier | Scale, mineral dust, wet pad growth | Inspect and report. Not in our standard scope. _(unconfirmed)_ | Any standing water in the airstream is a growth site. EPA: operate and maintain per the maker. |
| Acoustic liner, sound attenuators | Dust in porous fiberglass | Dry, gentle. Never wet. | Porous (ACR 4.4). |
| UV lamps at the coil (some units) | Lamp film | Leave them alone. | UV-C burns eyes and skin. The lamp circuit gets locked out with the unit. ASHRAE: lamp chambers should have lockable disconnects and warning labels on access doors. |
| Supply plenum | Should be fairly clean. Moisture stains mean water carryover. | Cleaned with the supply side. | Dirty supply is a red flag. See [Return side vs supply side](/kb/jobs/systems/return-side-vs-supply-side/). |

## Why dirty components cost energy

| Dirty part | What happens | Source |
|---|---|---|
| Filter | Resistance rises, airflow falls. DOE: a clean filter can lower AC energy use 5 to 15%. | DOE Energy Saver |
| Cooling coil | Dirt "reduces airflow and impairs its heat-absorption ability." | DOE Energy Saver |
| Blower wheel | Build-up on blades "results in decreased fan efficiency and higher operating costs." | DOE fan sourcebook |
| Drain pan and line | Clogged drains stop dehumidifying and leak water. | DOE Energy Saver |

That is the honest energy pitch: cleaning restores airflow and heat transfer. Do not quote a guaranteed savings percentage for duct cleaning.

## Rules on the unit

1. **Power off and lock out** before a panel comes off. See [Safety and PPE](/kb/jobs/rules/safety-and-ppe/#power-and-lockout).
1. **Never run the blower to help move debris** while ducts are open. It pushes through a dirty coil and out the open registers. ([JOB-013](/kb/jobs/write-ups/job-013-two-story-residential-attic-ahu-and-package-unit/))
1. **Coil last.** Whipping near the air handler drops debris into the coil, so it waits until the ducts are done. ([JOB-029](/kb/jobs/write-ups/job-029-new-bern-residential/))
1. **Mark every damper** in the unit before cleaning, restore after (ACR 4.8).
1. **Do not touch smoke detectors** in the unit or duct. ACR 4.10: cleaning must not impair or alter fire and smoke detection equipment.
1. **Filter in** before the unit runs again.
1. The **outdoor condenser coil** is not in the airstream and is not touched. See [What is in scope](/kb/jobs/rules/what-is-in-scope/).

## Sources

- [ACR, The NADCA Standard, 2021 Edition (PDF)](https://nadca.com/sites/nadca/files/docs/2021/acr_the_nadca_standard_2021_edition.pdf), sections 1.7.1, 4.4, 4.6, 4.8, 4.10, 4.11, definitions (AHU, HVAC system)
- [EPA: Should You Have the Air Ducts in Your Home Cleaned?](https://www.epa.gov/indoor-air-quality-iaq/should-you-have-air-ducts-your-home-cleaned)
- [DOE Energy Saver: Maintaining Your Air Conditioner](https://www.energy.gov/energysaver/maintaining-your-air-conditioner)
- [DOE: Improving Fan System Performance, a Sourcebook for Industry (PDF)](https://docs.nlr.gov/docs/fy03osti/29166.pdf), fan cleaning and contaminant build-up
- [PNNL: Best Practices for Air-Side Economizers O&M](https://www.pnnl.gov/projects/om-best-practices/air-side-economizers)
- [Marlo Coil: Condensate Drain Trapping (PDF)](https://www.marlocoil.com/wp-content/uploads/sites/2/2024/02/Condensate-Drain-Trapping.pdf)
- [ASHRAE Handbook 2020 Systems, Ch. 17 Ultraviolet Lamp Systems (PDF)](https://www.ashrae.org/file%20library/technical%20resources/covid-19/i-p_s20_ch17.pdf), safety design guidance
