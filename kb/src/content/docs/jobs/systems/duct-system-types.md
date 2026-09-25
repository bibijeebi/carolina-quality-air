---
title: "Duct system types"
description: "Single-zone constant volume, multizone, dual-duct, VAV with and without reheat, and fan-powered boxes: how each works, what it costs in energy, and how to spot it."
sidebar:
  order: 3
---
Every all-air system has the same job: meet a changing load in each zone. There are only two knobs. Change the **temperature** of the air, or change the **amount** of air. The system types are just different ways of turning those knobs.

**CAV changes temperature. VAV changes Volume.** Constant air volume (CAV) holds airflow fixed and varies supply temperature. Variable air volume (VAV) holds supply temperature fixed and varies airflow (CU Boulder HVAC systems overview).

## The systems at a glance

| System | How it meets each zone's load | Where the mixing or control happens | Heats and cools at once? |
|---|---|---|---|
| **Single-zone CAV** | One thermostat. Unit cycles or changes supply temperature. | At the unit | No |
| **CAV with reheat** | Air cooled for the worst zone, then reheated at each other zone | Reheat coil in each zone's duct | **Yes** |
| **Multizone** | Hot deck and cold deck mixed by dampers at the unit, one duct per zone | At the air handler | **Yes** |
| **Dual-duct** | Hot duct and cold duct both run to every zone and mix in a box there | At the zone mixing box | **Yes** |
| **VAV** (cooling only) | Cool air at a fixed temperature, box damper throttles the amount | VAV box at each zone | No |
| **VAV with reheat** | Box throttles down to a minimum, then reheat coil warms that minimum | VAV box at each zone | Yes, but only at minimum flow |
| **Fan-powered VAV** | VAV box plus a small fan that pulls warm ceiling plenum air in | VAV box at each zone | Less, plenum heat is used first |

**Mnemonic for the energy wasters: "Reheat, Multizone, Dual duct: they Really Mix Dollars."** All three cool air and then heat it back up, or mix hot and cold. DOE's reheat guide names constant volume reheat and dual duct as simultaneous heating and cooling systems. Better Buildings Partnership says hot deck/cold deck systems (multizone and dual duct) perform poorly for exactly that reason, plus leaky mixing dampers that let hot and cold streams blend when they should not.

## Single-zone constant volume

One unit, one thermostat, one zone. Fan runs at one speed. Almost every house is this, and so are small rooftop units on a store.

- **On site:** one unit, one thermostat, supply trunk and returns. Nothing in the duct but maybe balancing dampers.
- **On drawings:** one unit tag feeding one trunk. No terminal box tags.
- **Cleaning:** the simple case. Everything on [Order of operations](/kb/jobs/rules/order-of-operations/) applies as written.
- **Energy:** fine for one zone. It falls apart when one unit tries to serve rooms with different loads.

## Constant volume with reheat

A CAV unit serving several zones cools all the air for the zone that needs the most cooling. Every other zone warms it back up with a reheat coil in its branch. DOE: reheat "can be very energy intensive because they use simultaneous heating and cooling."

- **On site:** reheat coils in branch ducts, with hot water piping or an electric heater box on the duct, and no VAV boxes.
- **Cleaning:** reheat coils are in the supply duct. The NADCA guide spec's sample scope includes cleaning reheat coils and the supply duct downstream of them. Check the scope.

## Multizone

One air handler with a **hot deck** and a **cold deck** side by side. A set of mixing dampers at the unit's discharge blends hot and cold air for each zone. Each zone gets **its own duct leaving the unit**, already mixed (Better Buildings Partnership, CU Boulder).

- **Mnemonic:** **Multizone Mixes at the Machine.**
- **On site:** a unit with a row of zone dampers across the discharge and a bundle of separate ducts leaving it, one per zone. Older buildings: schools, courthouses, office buildings. _(no CQA multizone job recorded yet)_
- **On drawings:** one unit tag with many supply ducts leaving the casing, each labeled to a zone. Look for a hot deck / cold deck detail in the unit schedule or sections.
- **Cleaning:** the unit has two coil banks (heating and cooling) and a damper bank. Mark every zone damper before cleaning (ACR 4.8). Each zone duct is its own run from the unit. Count them on the walk, because each one is its own set of access openings.
- **Energy:** heats and cools at the same time every hour it runs. Mixing damper leakage makes it worse.

## Dual-duct

Two supply trunks, a **hot duct** and a **cold duct**, run side by side through the building. At each zone a **mixing box** takes both and blends them to the zone thermostat (Better Buildings Partnership). Some dual-duct boxes also vary total volume.

- **Mnemonic:** **Dual duct Delivers both, mixes at the Destination.**
- **On site:** two parallel supply trunks above the ceiling, and terminal boxes with **two inlet collars**, one from each trunk.
- **On drawings:** two supply trunks tracking each other, often tagged hot and cold, with terminal boxes connected to both. Check the legend for the tags.
- **Cleaning:** **both trunks are supply.** Double the supply duct footage of a single-duct building. Mixing boxes are an ACR supply-side inspection item (ACR 1.7.2). Mark box damper positions.
- **Energy:** same penalty as multizone. Better Buildings Partnership notes dual-duct systems usually serve multiple floors from one unit, multizone usually a single floor.

## VAV

The air handler makes cool air at a fixed temperature. At each zone a **VAV box** with a damper opens or closes to meet the thermostat. As the boxes close, the supply fan slows down. DOE fan sourcebook: fan power goes with the **cube** of speed, so a fan running slower saves far more than it looks.

- **Without reheat:** interior zones that only ever need cooling.
- **With reheat:** perimeter zones. The box throttles down to its **minimum** airflow (it never shuts fully, the zone still needs ventilation air), and only then does the reheat coil come on (DOE reheat guide).
- **Fan-powered:** a small fan in the box pulls warm return air from the ceiling plenum. **Series** fan runs all the time and moves all the air to the zone. **Parallel** fan sits beside the primary air path and only runs in heating (Titus, MEP Academy).
- **On site:** the rooftop or mechanical room unit feeds a trunk above the drop ceiling. Boxes with an actuator and a controller hang on the trunk or branches, flex out to diffusers. See [Rooftop unit and VAV](/kb/jobs/systems/rooftop-unit-and-vav/). JOB-005 at the ENC School for the Deaf was an air handler with VAV boxes through the building.
- **On drawings:** box symbol with a VAV tag on the supply side. A VAV box is **never on a return**.
- **Cleaning:** the boxes are what you work around. Details on [VAV boxes](/kb/jobs/systems/vav-boxes/).
- **Energy:** the most efficient of the all-air systems here, because the fan slows and there is no mixing of hot and cold except reheat at minimum.

## What changes for the crew

| System | Supply ductwork | What is in the way | Extra items to scope |
|---|---|---|---|
| Single-zone CAV | One trunk | Balancing dampers | None |
| CAV reheat | One trunk | Reheat coils in branches | Reheat coil cleaning |
| Multizone | One duct **per zone** from the unit | Zone damper bank at the unit | Two coil banks, zone dampers |
| Dual-duct | **Two** trunks, hot and cold | Mixing boxes, two inlets each | Double the trunk footage, mixing boxes |
| VAV | Medium-pressure trunk to boxes, low-pressure branches after | VAV boxes, flow sensors, actuators | Reheat coils, fan box filters |

Return side is the same idea in all of them: grilles, return duct or ceiling plenum, back to the unit. A non-ducted ceiling plenum return is not part of the HVAC system under ACR.

## Sources

- [CU Boulder, M. Brandemuehl: HVAC Systems Overview (PDF)](https://ceae.colorado.edu/~brandem/aren3050/docs/HVACDesignOverview.pdf), CAV, VAV, dual duct, multizone, parallel fan-powered box
- [DOE Better Buildings Alliance: Minimizing Simultaneous Heating and Cooling in Existing Laboratory Buildings with Reheat Systems (PDF)](https://www1.eere.energy.gov/buildings/publications/pdfs/alliances/minimizing_reheat_guide.pdf)
- [Better Buildings Partnership: Hot Deck/Cold Deck Systems](https://www.betterbuildingspartnership.com.au/information/hot-deckcold-deck-systems/)
- [DOE: Improving Fan System Performance, a Sourcebook for Industry (PDF)](https://docs.nlr.gov/docs/fy03osti/29166.pdf), fan speed and power
- [Titus Engineering Corner: Series vs. Parallel Fan-Powered Terminal Units](https://titus-hvac.blogspot.com/2012/08/q-compare-series-vs-parallel-fan.html)
- [MEP Academy: Fan Powered Terminal Units](https://mepacademy.com/fan-powered-terminal-units/)
- [ACR, The NADCA Standard, 2021 Edition (PDF)](https://nadca.com/sites/nadca/files/docs/2021/acr_the_nadca_standard_2021_edition.pdf), sections 1.7.2, 4.8, HVAC system definition
- [NADCA 2021 General Specification, Section 230130.51 (PDF)](https://nadca.com/sites/nadca/files/NADCA_2021_General_Specification.pdf), scope of work examples (reheat coils)
