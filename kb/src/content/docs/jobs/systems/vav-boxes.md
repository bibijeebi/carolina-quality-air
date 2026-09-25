---
title: "VAV boxes"
description: "What is inside a VAV box, single-duct vs fan-powered, reheat and minimum airflow, and how to clean around one without breaking its controls."
sidebar:
  order: 4
---
A VAV box is a damper in a box, with a brain. It sits on the supply side between the trunk and the diffusers it feeds, and it decides how much air that zone gets. Every commercial building with a drop ceiling is likely to have them. ACR lists VAV boxes, fan-powered terminal boxes, mixing boxes, and reheat coils as supply-side inspection items (ACR 1.7.2).

<dl class="facts">
<dt>Side</dt><dd>Supply. Never on a return.</dd>
<dt>Parts</dt><dd>Inlet collar, flow sensor, damper, actuator, controller. Often a reheat coil. Fan-powered adds a fan, an induction opening, and a filter.</dd>
<dt>Rule</dt><dd>Mark the damper position, restore it after (ACR 4.8). Hands off the actuator and the flow sensor.</dd>
</dl>

## What is inside, air in to air out

| Part | What it does | Cleaning note |
|---|---|---|
| **Inlet collar** | Round connection to the supply trunk or branch | Debris collects here. Clean the inlet. |
| **Flow sensor** | Cross or ring of tubing at the inlet that reads airflow for the controller | Do not bend it, coat it, or plug its holes. A damaged sensor makes the box misread its own airflow. |
| **Damper** | Round or rectangular blade that opens and closes | Mark its position. Clean the blade gently. |
| **Actuator** | Small motor on the outside of the box that turns the damper shaft | Hands off. Do not force the shaft against it. |
| **Controller** | Box of electronics on the side, wired to the thermostat and building controls | Hands off. Keep water away. |
| **Reheat coil** (some) | Hot water or electric coil at the discharge | Coil rules apply. Electric: lock out before cleaning (ACR 4.11.8). |
| **Discharge** | Outlet to the low-pressure duct or plenum box feeding the diffusers | Clean the outlet. |

MEP Academy's list for a fan-powered box: "a primary air damper with a flow sensor, a fan section, usually with an ECM motor, an induction opening for return air, and often a reheat coil, which can be either electric or hot-water," plus sound insulation, filters, and a controller. A plain single-duct box is the same without the fan and induction opening.

## How it runs

1. The air handler sends cool air at a fixed temperature.
1. Zone too warm: the damper opens. More air, more cooling.
1. Zone cooling off: the damper closes down to its **minimum**. It never shuts fully, because the zone still needs ventilation air.
1. Still too cool at minimum: the **reheat** coil comes on and warms that minimum airflow (DOE reheat guide).

**Minimum then reheat, never closed.** That is the sequence to remember.

## Single-duct vs fan-powered

| Box | Fan | When the fan runs | Air to the zone | Recognize it |
|---|---|---|---|---|
| Single-duct | None | No fan | Varies | One inlet, actuator, controller, maybe a coil |
| **Series** fan-powered | In line, all air passes through it | All the time the building is occupied | Constant | Fan in the main path, induction opening on the side |
| **Parallel** fan-powered | Beside the primary path | Only in heating | Varies in cooling | Fan off to the side, backdraft flap on its outlet _(typical, check the unit)_ |
| Dual-duct | None | No fan | Blend of hot and cold | **Two** inlet collars |

**Series is Steady. Parallel is Part-time.** Titus: series fans "must run throughout the occupied mode," parallel fans "only switch on during the heating mode to pull warm return air from the ceiling plenum."

The induction opening on a fan-powered box pulls unfiltered ceiling plenum air, often through a small filter. That filter loads up. If the box has one, note its condition and whether new filters are in scope. _(CQA practice on fan box filters unconfirmed)_

## Working around them

These are the rules CQA trains on:

1. **Find them before you cut.** On the drawing a VAV box is a box with a VAV tag on the supply trunk or branch. On site it is the box with an actuator and controller on it, one duct in, flex out to diffusers.
1. **No whip or rod through the box.** Clean the upstream duct to the inlet from one access, the downstream duct from another.
1. **If the box is opened:** inlet, damper blade, outlet, then close it up the way you found it. Hands off the actuator and the flow sensor. The controls are the expensive part.
1. **Mark the damper position** before cleaning. Restore it after (ACR 4.8).
1. **A box parked at minimum** blocks your airflow and your tools. The building's controls person can command it open. Do not drive the actuator by hand. Note what it was and have it put back. _(procedure unconfirmed, ask the lead)_
1. **Reheat coils** are in the NADCA guide spec's sample scope with the supply duct downstream of them. Check whether our scope includes them.
1. **Report** a box that looks stuck, a sensor tube that is kinked or loose, or a controller with water damage. Photograph it.

## Sources

- [ACR, The NADCA Standard, 2021 Edition (PDF)](https://nadca.com/sites/nadca/files/docs/2021/acr_the_nadca_standard_2021_edition.pdf), sections 1.7.2, 4.8, 4.11.8
- [MEP Academy: Fan Powered Terminal Units](https://mepacademy.com/fan-powered-terminal-units/)
- [Titus Engineering Corner: Series vs. Parallel Fan-Powered Terminal Units](https://titus-hvac.blogspot.com/2012/08/q-compare-series-vs-parallel-fan.html)
- [DOE Better Buildings Alliance: Minimizing Simultaneous Heating and Cooling ... with Reheat Systems (PDF)](https://www1.eere.energy.gov/buildings/publications/pdfs/alliances/minimizing_reheat_guide.pdf)
- [CU Boulder, M. Brandemuehl: HVAC Systems Overview (PDF)](https://ceae.colorado.edu/~brandem/aren3050/docs/HVACDesignOverview.pdf), air terminals and parallel fan power mixing box
- [NADCA 2021 General Specification, Section 230130.51 (PDF)](https://nadca.com/sites/nadca/files/NADCA_2021_General_Specification.pdf), scope of work examples (reheat coils)
