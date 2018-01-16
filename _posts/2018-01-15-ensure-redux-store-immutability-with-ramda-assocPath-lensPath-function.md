---
layout: post
title:  "Ensure redux store immutability with ramda's assocPath/lensPath function"
date:   2018-01-15
categories: Default
tags: redux immutable ramda
comments: 1
---
<script src="/assets/js/svg.js"></script>
<script type="text/javascript">
  window.onload = function () {
    tree([2,2,1,1,2,,1,1,,2,1,,,,,,,,,1,1]);
  }
</script>

When working with react local state or redux store, you have to keep the old state immutable and generate new state.

If you change the old state directly, your UI components will not be notified of the changes, thus the UI will not change.

<!--more-->

In this post, we are going to talk about ensuring immutability with Ramda's assocPath function, which is very useful when you have a deeply nested state (Although should be avoided in the first place).

It is hard to modify a deeply nested node in a state object with plain javascript if we want to keep the old object immutable. The reason is you have to create new copies for every node along the path from the root of the state object to the target node (all green nodes in the tree below).

<div id="tree"></div>

This is called _structural sharing_.

For example, if we have the following state object:

```js
const state = {
  artists: [
    {
      id: 1,
      name: 'Michael Jackson',
      albums: [
        { id: 1, ... },
        {
          id: 2,
          name: 'Thriller',
          songs: [
            ...,
            { id: 5, title: 'Beat It' },
            ...
          ]
        },
      ]
    },
    ...
  ],
  ...
};
```

If we want to change the title of the song 'Beat It', in order to keep the state object immutable, we have to do the following:

```js
const song = {...state.artists[0].albums[1].songs[4], title: 'BEAT IT'};

const songs = [...state.artists[0].albums[1].songs];
songs[4] = song;

const album = {...state.artists[0].albums[1], songs};

const albums = [...state.artists[0].albums];
albums[1] = album;

const artist = {...state.artists[0], albums};

const artists = [...state.artists];
artists[0] = artist;

const newState = {...state, artists};
```

That's a lot of work everytime you want to change something deep, and very error-prone. It needs to be abstracted away from your application code which should only contain business logic and not implementation logic.

Ramda's [assocPath](http://ramdajs.com/docs/#assocPath) function is perfect for this task.

## Ramda

Similar to lodash and underscore, [Ramda](http://ramdajs.com/) is a javascript library which provides functions that work with javascript objects, arrays and strings. The difference is that Ramda is designed specifically for functional programming style, which means:

* Ramda functions never mutate data, they are pure and always return new copies of data
* Ramda functions support currying, and the target parameter is always at the end, which makes it much easier to do function composition

For more information on Ramda, check the following:

[Thinking in Ramda](http://randycoulman.com/blog/categories/thinking-in-ramda/)

[Hey Underscore, You're Doing It Wrong!](https://www.youtube.com/watch?v=m3svKOdZijA&app=desktop)

[What Function Should I Use?](https://github.com/ramda/ramda/wiki/What-Function-Should-I-Use%3F)

## assocPath

Ramda provides a function called [assocPath](http://ramdajs.com/docs/#assocPath), which will create a shallow clone of an object, then modify a given node based on a given path. The path is an array containing the name or the array index of each node along the path. So instead of creating new copies of the nodes along the path ourselves, we can provide an array representing the path, and let assocPath function create new copies of those nodes for us. 

With assocPath, the previous updating logic can be simplified to:

```js
import { assocPath } from 'ramda';

const newState = assocPath(
  ['artists', 0, 'albums', 1, 'songs', 4, 'title'],
  'BEAT IT',
  state
);
```

That's much easier to understand and less error-prone. Immutability is also guaranteed. 

## lensPath

If the new value is calculated based on the old value, you have to specify the path twice:

```js
const newState = assocPath(
  ['artists', 0, 'albums', 1, 'songs', 4, 'title'],
  state.artists[0].albums[1].songs[4].title.toUpperCase(),
  state
);
```

To avoid this, you can use another Ramda function called [lensPath](http://ramdajs.com/docs/#lensPath). It builds a lens object based on the path, then you can [view](http://ramdajs.com/docs/#view) (read the value), [set](http://ramdajs.com/docs/#set) (set the value) or [over](http://ramdajs.com/docs/#over) (calculate new value based on the old value) the lens object.

```js
import { lensPath, over } from 'ramda';

const newState = over(
  lensPath(['artists', 0, 'albums', 1, 'songs', 4, 'title']),
  t => t.toUpperCase(),
  state
);
```

The lens functions are actually implemented using assocPath function in Ramda.

## Find array item in the path

With Ramda's assocPath or the lensPath function, it's much easier to update a deeply nested object while keeping immutability. However, you can only specify an array index to locate an array item, which means you still have to find the index of an array item yourself:

```js
import { lensPath, over } from 'ramda';

const artistIndex = state.artists.findIndex(x => x.id === 1);
const albumIndex = state.artists[artistIndex].albums.findIndex(x => x.name === 'Thriller');
const songIndex = state.artists[artistIndex].albums[albumIndex].songs.findIndex(x => x.id === 5);

const newState = over(
  lensPath(['artists', artistIndex, 'albums', albumIndex, 'songs', songIndex, 'title']),
  t => t.toUpperCase(),
  state
);
```

Which makes the code complecated again.

To solve this problem, I created a library [ipath](https://github.com/ln613/ipath), which allows you to specify a condition in a string path to find an array element:

```js
import { update } from 'ipath';

const newState = update(
  state,
  'artists[id=1].albums[name=Thriller].songs[4].title',
  'BEAT IT'
);
```

It's implemented based on Ramda's assocPath/lensPath function, so immutability is guaranteed.

[immutability]: /immutability
