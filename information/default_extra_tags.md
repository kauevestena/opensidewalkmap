# EXTRA TAGS CONFIGURATION

## How default inclusion rules are defined

    OTHER_FOOTWAY_RULES = {'highway':['steps','living_street','pedestrian','track','path'],'foot':['yes','designated','permissive'],'footway': ['alley','path','yes']}

This is described in the OSMNX standard, that you can check at the documentation, such as in [this function](https://osmnx.readthedocs.io/en/stable/user-reference.html#osmnx.features.features_from_address), basically tags are mapped as dicts and for having the union of many you just pass a list with the values.

Then, in the same order:

- [highway=steps](https://wiki.openstreetmap.org/wiki/Tag:highway=steps) : steps, stairs
- [highway=living_street](https://wiki.openstreetmap.org/wiki/Tag:highway=living_street) : living streets, that are streets with explicit shared use
- [highway=pedestrian](https://wiki.openstreetmap.org/wiki/Tag:highway=pedestrian) : explicit and exclusive pedestrian paths, generally in very urbanized areas
- [highway=track](https://wiki.openstreetmap.org/wiki/Tag:highway=track) : tracks frequently allow pedestrians, being sometimes also the main pedestrian path in some less urbanized areas
- [highway=path](https://wiki.openstreetmap.org/wiki/Tag:highway=path) : this one can be tricky, a good candidate for exclusion in some areas, since may be used for car roads (even tough they maybe be re-tagged with a better highway=* value)
- [foot=yes](https://wiki.openstreetmap.org/wiki/Tag:foot=yes) : sometimes there's no pedestrian dedicated path, so the street is used for foot, in a sort of improvised way
- [foot=designated](https://wiki.openstreetmap.org/wiki/Tag:foot=designated) : designated footways, this will include obviously sidewalks, so some will be later excluded, read the second part of this documentation
- [foot=permissive](https://wiki.openstreetmap.org/wiki/Tag:foot=permissive) : even more "improvised" footways, can be in the sense that the permission might be removable
- [footway=alley](https://wiki.openstreetmap.org/wiki/Tag:footway=alley) : one of less common footways, included because it's on the wiki
- [footway=path](https://wiki.openstreetmap.org/wiki/Tag:footway=path) : one of less common footways, included because it's on the wiki
- [footway=yes](https://wiki.openstreetmap.org/wiki/Tag:footway=yes) : one of less common footways, included because it's on the wiki

## How default exclusion rules are defined

    OTHER_FOOTWAY_EXCLUSION_RULES = {'highway': ['trunk','motorway','primary','trunk_link','motorway_link','primary_link']}

Same standard as before. Since OSMNX will download all the features containing the tags in the other list, we must exclude some features with tags that are in a bigger hierarchical level.

Then, in the same order:

- [highway=trunk](https://wiki.openstreetmap.org/wiki/Tag:highway=trunk) : trunk roads, a pedestrian should never walk there
- [highway=trunk_link](https://wiki.openstreetmap.org/wiki/Tag:highway=trunk_link) : same as trunk roads
- [highway=primary](https://wiki.openstreetmap.org/wiki/Tag:highway=primary) : primary roads, generally a pedestrian shouldn't walk there
- [highway=primary_link](https://wiki.openstreetmap.org/wiki/Tag:highway=primary_link) : same as primary roads
- [highway=motorway](https://wiki.openstreetmap.org/wiki/Tag:highway=motorway) : motorways, a pedestrian should never walk there
- [highway=motorway_link](https://wiki.openstreetmap.org/wiki/Tag:highway=motorway_link) : same as motorways roads

Depending on the local standard, secondary and even tertiary roads might also be included on the list.
Depending on the local standard, maybe for example primary roads might be cut off from the list.
