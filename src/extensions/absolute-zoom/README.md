#  Absolute Zoom

The cropper state `CropperState` doesn't have the concept of absolute zoom. 
It can be only derived from it.

Alas, it depends on some assumptions, so this feature was extracted as extension. 
You can use the source code of this extension to clarify the
deriving of the absolute zoom from the state.

### Functions

### `getAbsoluteZoom`

**Definition:**
````
getAbsoluteZoom(state: CropperState, settings: CropperSettings, normalize = true): number
````

**Details:**

This function returns the current absolute visible area size (with respect to different restrictions):
`0` correspond to the minimum size and `1` correspond to the maximum size.

If `normalize` is `true` the result will always belong to `[0, 1]`.

### `getZoomFactor`

**Definition:** 
````
getZoomFactor(state: CropperState, settings: CropperSettings, absoluteZoom: number): number
````

**Details:**

This function returns the ratio of the visible area size that corresponds to desired absolute zoom and the visible area size that corresponds to the current absolute zoom. 

In other words, it's the relative visible area scale that is needed to get
the desired absolute zoom.

### How to use

The using of these functions is pretty straightforward.

#### Getting the current absolute zoom

```tsx
const absoluteZoom = getAbsoluteZoom(cropper.getState(), cropper.getSettings());
```

#### Zooming the cropper to specific absolute zoom:

```tsx
const onZoom = (value: number, transitions?: boolean) => {
  if (cropper) {
    cropper.zoomImage(
      getZoomFactor(cropper.getState(), cropper.getSettings(), value),
      {
        transitions,
      },
    );
  }
};
```
