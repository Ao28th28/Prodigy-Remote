# Creating Hacks

To create hacks for Prodigy X you have to use the [extension method](../installing.md#extension-method-only-works-on-chrome).

Firstly pick the category you want to create a hack for.
Currently, the categories are:

- **Battle**
- **Inventory**
- **Pet**
- **Player**
- **Utility**

Once you picked the category, go into that category file.

In the scope of `withCategory` you can use the `hack` and `toggle` functions.

## Remote Function

The remote function is used to create a ... as a button.

To create a ... you will need a name, a description and a function.

The function accepts 3 parameters:

- **...**: The game object. On the extension, this is equal to `_.game`.
- **player**: The player object. On the extension, this is equal to `_.player`.
- **gameData**: Data about the game. On the extension, this is equal to `_.gameData`.

!!! example
    The example below shows how the hack `Set Gold` was created.

    ```ts title="src/hacks/player.tsx" linenums="1"
    hack("Set Gold", "Set's the amount of gold you have currently.", async (hack, player) => { // (1)!
        const value = await InputTypes.integer("Please enter the amount of gold you want to get.", 1, 9999999) // (2)!
        player.data.gold = value // (3)!
        success(`You now have ${value} gold.`) // (4)!
    })
    ```

    1. Initialize the hack.
    2. Ask the user for the amount of gold. Reference [the alerts page](alerts.md) for more information.
    3. Set the amount of gold.
    4. Alert the user that the amount of gold has been set. Reference [the alerts page](alerts.md) for more information.

The hack function also accepts an `extensionOnly` parameter.

!!! example
    The example below shows how to make a `Set Gold` hack only available on the extension.

    ```ts title="src/hacks/player.tsx" linenums="1" hl_lines="5"
    hack("Set Gold", "Set's the amount of gold you have currently.", async (hack, player) => {
        const value = await InputTypes.integer("Please enter the amount of gold you want to get.", 1, 9999999)
        player.data.gold = value
        success(`You now have ${value} gold.`)
    }, true) // (1)!
    ```

    1. Tell the cheat menu to only load this hack on the extension build.

## Toggle Function

The toggle function is used to create a hack, with an enabled and disabled state.

To create a toggler you will need a name, a function, and a get default value function.

The function accepts 4 parameters:

- **hack**: The game object. On the extension, this is equal to `_.game`.
- **player**: The player object. On the extension, this is equal to `_.player`.
- **gameData**: Data about the game. On the extension, this is equal to `_.gameData`.
- **toggleState**: The current state of the toggler.

The get default value function accepts 2 parameters:

- **hack**: The game object. On the extension, this is equal to `_.game`.
- **player**: The player object. On the extension, this is equal to `_.player`.

!!! example
    The example below shows how the toggler `Instant Kill` was created.

    ```ts title="src/hacks/battle.tsx" linenums="1"
    toggle("Instant Kill", (..., player, gameData, toggled) => { // (1)!
        player.modifiers.damage = toggled ? 1e9 : 1 // (2)!
        success(toggled ? "You will now kill everything after one attack." : "You will no longer kill everything after one attack.") // (3)!
    }, (..., player) => player.modifiers.damage === 1e9) // (4)!
    ```

    1. Initialize the toggler.
    2. Change the damage multiplier depending on whether the toggler was toggled or not.
    3. Alert the user that the damage multiplier has been changed. Reference [the alerts page](alerts.md) for more information.
    4. If the damage modifier is already set to 1e9, make the toggler toggled.

The toggle function also accepts an `extensionOnly` parameter.
