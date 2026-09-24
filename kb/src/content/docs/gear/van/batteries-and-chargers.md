---
title: Batteries and chargers
description: The DeWalt 20V packs and chargers in the vans, the Milwaukee odd ones out, the numbering scheme, the charger repair history, and the adapter rule.
sidebar:
  order: 2
---

The drills, impacts, fans and the worklight all run on 20V packs. The fleet is mostly DeWalt with some Milwaukee. Packs and chargers don't cross brands.

<dl class="facts">
<dt>Packs</dt><dd>Four DeWalt 20V MAX packs as of September 16, 2026: 6Ah, 6Ah, 5Ah, 2Ah. All take a charge. Three or four more wanted.</dd>
<dt>Chargers</dt><dd>Three DeWalt chargers, one per van under a front seat: DCB118 (fan-cooled fast), DCB112, DCB110. One Milwaukee M12/M18 charger in Van 3.</dd>
<dt>Draw on them</dt><dd>Two drills, two impacts, three DeWalt fans and a worklight across four packs.</dd>
<dt>Cadence</dt><dd>Jeff's rule of thumb: packs need a charge about once a week. Start charging first thing at the Sunday reset.</dd>
<dt>Direction</dt><dd>DeWalt is the van standard. Jeff's Milwaukee gear stays with his setup.</dd>
</dl>

## Where they are

| Van | Charger | Mounts on the partition |
|---|---|---|
| Van 1 | DCB110 | 3-slot DeWalt rail |
| Van 2 | DCB118 | 2 DeWalt, 1 Milwaukee |
| Van 3 | DCB112, plus the Milwaukee charger | Milwaukee rail |

Van 3 has the inverter, so it's the only van that can charge on the road. The plan is to swap the DCB118 into Van 3 because it's the fastest charger.

:::note[Look under the seats first]
At the start of the September 16 reset the count was one charger and no confidence. By mid-afternoon it was three chargers and four good packs, all under seats or clipped onto tools in Van 3. The second-charger purchase got cancelled. Count before you buy.
:::

## The chargers

| Model | What the maker says |
|---|---|
| DCB118 | Fan-cooled fast charger. 8 A for premium packs, 4 A for compact packs. The fan helps prevent hot/cold pack delays. Charges a 6.0Ah FLEXVOLT pack in about 60 minutes. Wall mountable. |
| DCB112 | Standard (not fan-cooled) charger. Same light codes as the DCB118. |
| DCB110 | Standard charger. Check its label for the packs it takes. |

**Lights (DCB112 and DCB118 manuals):**

| Light | Meaning |
|---|---|
| Red blinking | Charging. |
| Red solid | Fully charged. Use it or leave it in. |
| Red blinking plus yellow on | Hot/cold pack delay. The pack is too hot or too cold. The charger waits and resumes on its own. |
| Problem-pack or problem-charger blink, or no light | Fault. Find out which half is bad (below). |

**Temperature.** DeWalt says charge between 65°F and 75°F for best results and not below 40°F or above 104°F. A closed cargo area in summer can get past that. Charge in the shop or the cab with the AC on.

## Pack or charger? Isolate first

1. Put the suspect pack on a second, known-good charger.
2. Put a known-good pack on the suspect charger.
3. The one that faults in both tests is the bad one.

That is how the dead DCB102 dual charger was found in August 2026: every pack faulted in both bays of the DCB102 and charged fine on the other chargers, so the charger was the problem, not the batteries. See [repair WO-001](/repairs/2026-08-22).

:::danger[Charger repair]
The DCB102 bench check in WO-001 opens the case. The main filter capacitor inside holds about 300 V DC after the charger is unplugged. Don't open a charger unless you know how to discharge it. Otherwise set it aside and label it.
:::

Two other lessons from that report:

- Duct dust is conductive grime. Blow out chargers and keep them in a closed spot, not open on the floor.
- The yellow DC9320 dual charger looks like a DCB102 but is for NiCd/NiMH packs only. It won't charge 20V MAX lithium packs.

## Cross-brand adapters

Adapters that let a Milwaukee M18 pack run a DeWalt tool (or the reverse) exist. The shop position from WO-001:

- **Tool use only.** Pull the pack off the adapter before it goes near any charger. Adapters don't have charging circuits.
- Charging stays brand-native: DeWalt on DeWalt, Milwaukee on Milwaukee.
- Neither maker supports adapters, so a pack damaged on one is not a warranty claim.
- We don't have any adapters in the fleet as of September 2026 _(unconfirmed)_.

## Numbering

Every tracked battery, charger and tool gets a permanent ID. The van it's assigned to goes on a separate label, because moving a pack doesn't change what it is.

| Prefix | For |
|---|---|
| B01, B02... | Batteries |
| C01, C02... | Tool-battery chargers |
| T01, T02... | Tools |

Record for each: ID, maker and model, serial or date code, capacity, assigned van, condition (working, weak, needs diagnosis, retire), last check, next action. A full charge light is not a capacity test. Note packs that die early.

The USB-C car chargers in the vans are for phones. They are not tool-battery chargers.

Field guide: [battery and charger check](/learning/field-guide/battery-charger-check.html).

## Sources

- [DeWalt DCB118 product page](https://www.dewalt.com/product/dcb118/20v-max-fan-cooled-fast-charger)
- [DeWalt DCB118 manual, charger operation (ManualsLib)](https://www.manualslib.com/manual/1240180/Dewalt-Dcb118.html?page=10)
- [DeWalt DCB112 manual (ManualsLib)](https://www.manualslib.com/guide/3739600/dewalt-dcb112-manual.html)
