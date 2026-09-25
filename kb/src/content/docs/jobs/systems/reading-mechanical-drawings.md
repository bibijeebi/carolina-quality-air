---
title: "Reading mechanical drawings"
description: "How to find supply, return, exhaust, and outside air on an M sheet, the symbols that matter for duct cleaning, and the order to read a set in."
sidebar:
  order: 7
---
ACR 2021 1.3: "Both building floor plans and mechanical plans, if available, shall be used during the inspection, cleaning, and restoration work." On a commercial job the M sheets tell you how much duct there is, where it goes, and what is in the way before you pull a single tile.

Practice on the two trainers:
- [Duct Reflex](/learning/duct-reflex.html): look at a symbol, sheet, or field scene and call it supply, return, exhaust, or outside air.
- [Read the Print](/learning/read-the-print.html): a generated mechanical sheet with a takeoff to do and the crew brief to check against.

## Read a set in this order

1. **Title block.** Which building, which level, which year. Is this the current revision?
1. **General notes.** Duct material, insulation (wrap or liner), whether the ceiling is a return plenum.
1. **Schedules.** Diffuser and grille schedule for counts, CFM, neck sizes. Equipment schedule for unit tags and types.
1. **Plan.** Unit or riser, trunk sizes, elbows, reducers, branches, and the return path.
1. **What is missing.** Other levels, the unit itself, details on another sheet, anything existing that is not being replaced.

**Mnemonic: "Tired Nurses Skip Paperwork Mondays."** Title block, Notes, Schedules, Plan, Missing.

## Which way is the air going

| Cue | Supply | Return | Exhaust | Outside air |
|---|---|---|---|---|
| Tag | SA | RA | EA | OA |
| Outlet | Diffuser (CD, square inside a square, arrows out) or sidewall register (SR) | Grille (RG, square with diagonals or one slash). TG over a door is a transfer grille, return path. | Exhaust grille (EG) in toilets and janitor closets | Louver on an exterior wall with a motorized damper (MOD) |
| Duct size along the run | **Steps down** moving away from the unit | **Grows** moving toward the unit | Runs to an exhaust fan (EF), not the unit | Short run into the mixing box |
| What it connects to | Unit discharge, VAV boxes | Unit return, or open ceiling plenum | EF-1 on the roof, wall cap with a backdraft damper (BDD) | Mixing box |
| Cleaning scope | Yes | Yes. Plenum return is not duct. | Separate line item | Not the loop unless scoped |

**Supply shrinks, return grows.** Supply sheds air at every branch, so it steps down. Return collects air, so it gets bigger on the way home.

**Egg-crate grille with no duct drawn to it and a plenum note** means the whole ceiling cavity is the return. ACR does not count a non-ducted ceiling plenum as part of the HVAC system.

**Kitchen hood with welded grease duct to a roof fan (KEF)** is exhaust and a different trade (NFPA 96, IKECA). See [JOB-022 Logan's Roadhouse](/kb/jobs/write-ups/job-022-logans-roadhouse-greenville/).

## Symbols that matter to us

| Symbol | Means | Why we care |
|---|---|---|
| Two parallel lines with a size like 20x14 | Rectangular duct. First number is the width you see in plan, second is height. | Sets patch size and access spacing. The numbers flip when the duct turns. |
| Two lines with a ø size | Rigid round duct | Brushes fine |
| Two lines with diagonal hatching | Flex duct | No access holes in flex. See [Flex duct](/kb/jobs/systems/flex-duct/). |
| Box with an X, "SA UP" or "RA DN" | Duct rising or dropping through a floor or roof | Elevation change and an access point |
| Lettered hexagon | Diffuser tag | Look it up in the schedule |
| Box with "VAV-3" on a duct | VAV terminal box | Supply side. Work each side of it. See [VAV boxes](/kb/jobs/systems/vav-boxes/). |
| Slash across the duct with a small circle, "VD" | Manual volume (balancing) damper | Photograph the position, restore it |
| Blade symbol at a heavy wall line, "FD" | Fire damper at a rated wall | Access each side, nothing through it |
| Same with an X, "FSD" | Combination fire/smoke damper | Same, plus hands off the actuator |
| Heavy dark wall line | Rated wall | Expect a fire damper wherever a duct crosses it |
| Circle with a cross, "EF-1" | Exhaust fan | Its own system and count |
| Circle with T on a wall | Thermostat | Tells you which zone a box or unit serves |
| Dashed duct, "EXIST." | Existing to remain | Different age, often a different system. Scope it separately. |
| "B.O.D. EL." | Bottom of duct elevation | Subtract ceiling elevation for your clearance |
| Circle split by a line, number over sheet number | Detail or section reference | Where the riser or curb is actually drawn |
| Column grid bubbles with dash-dot lines | Structural grid | Bays are dimensioned. Use the grid as your ruler for duct length. |
| Heavy line closing a trunk, "END CAP" | End of a trunk | Debris piles up here. Always an access. |

These are the conventions in our trainers. **The legend on the actual set wins.** Every engineer draws a little differently.

## Spotting the system type on a set

| Look for | Probably |
|---|---|
| One unit, one trunk, no terminal boxes | Single-zone constant volume |
| Reheat coils in branches, no VAV boxes | Constant volume with reheat |
| One unit with a separate duct leaving for each zone | Multizone |
| Two supply trunks running side by side to boxes with two inlets | Dual-duct |
| VAV tags on the supply side, flex from boxes to diffusers | VAV. Fan-powered if the schedule lists a fan and an induction inlet. |

See [Duct system types](/kb/jobs/systems/duct-system-types/).

## Drawings are not the building

1. **Count units yourself.** Do not trust the drawings alone. ([JOB-028](/kb/jobs/write-ups/job-028-green-road-pre-bid-walk/))
1. **Look for what the drawings do not show:** fabric duct, lift access, retained equipment, hard ceilings. (JOB-028)
1. **Sets go out of date.** If the set and the ceiling disagree, the ceiling wins. The walk settles it. See [Walk the job](/kb/jobs/procedures/walk-the-job/).
1. **In the field, the tissue test settles supply vs return.** Tissue blows off: supply. Tissue sticks: return.

## Sources

- [ACR, The NADCA Standard, 2021 Edition (PDF)](https://nadca.com/sites/nadca/files/docs/2021/acr_the_nadca_standard_2021_edition.pdf), section 1.3, HVAC system definition (ceiling plenums)
- CQA trainers: [Duct Reflex](/learning/duct-reflex.html) and [Read the Print](/learning/read-the-print.html)
