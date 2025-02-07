import { h } from "preact"
import { confirm, InputTypes, success, error, customMessage } from "../swal"
import { GameData } from "../types/gameData"
import { Player } from "../types/player"
import { Category } from "./base/categories"
import { withCategory } from "./base/registry"

const names = ["Boots", "Buddies", "Fossils", "Hats", "Items", "Key Items", "Tower Town Frames", "Tower Town Interiors", "Mounts", "Outfits", "Relics", "Weapons", "Currencies"]
const ids = ["boots", "follow", "fossil", "hat", "item", "key", "mathTownFrame", "mathTownInterior", "mount", "outfit", "spellRelic", "weapon", "currency"]

function itemify (item, amount) {
    return item.map(i => ({
        ID: i.ID,
        N: amount
    })).filter(v => v !== undefined)
}

function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export type LootItem = {
    ID: number;
    type: string;
    quantity: number;
};

export function getAllItems (player: Player, gameData: GameData, value: number) {
    ids.forEach(id => {
        player.backpack.data[id] = itemify(gameData[id].filter(l => id === "follow" ? ![125, 126, 127, 128, 129, 134, 135, 136, 137].includes(l.ID) : l), value)
    })

    gameData.dorm.forEach(x => {
        player.house.data.items[x.ID] = { A: [], N: value }
    })

    const bountyIndex = () => player.backpack.data.item.findIndex(v => v.ID === 84 || v.ID === 85 || v.ID === 86)
    while (bountyIndex() > -1) {
        player.backpack.data.item.splice(bountyIndex(), 1)
    }
}

withCategory(Category.INVENTORY, ({ hack }) => {
    hack("Item Stacker", "Get's a certain amount of every item.", async (hack, player, gameData) => {
        const value = await InputTypes.integer("Please enter the amount of every item you want to get.", 0, 9999)

        getAllItems(player, gameData, value)

        success(`You now have ${value} of every item.`)
    })
    hack("Clear Inventory", "Clear's every item from your inventory.", async (hack, player) => {
        const confirmed = await confirm("Are you sure you want to clear your inventory?")
        if (!confirmed) {
            error("Cancelled by user.")
            return
        }
        Object.keys(player.backpack.data).forEach(i => {
            player.backpack.data[i] = []
        })
        success("Cleared every item from your account.")
    })
    hack("Selector (Basic)", "Select how many items of individual categories you want to get.", async (hack, player, gameData) => {
        const value = await InputTypes.select("Please select the category of items you want to get.", names)
        const name = names[value]
        const id = ids[value]
        let amount = await InputTypes.integer(`Please enter the amount of ${name.toLocaleLowerCase()} you want to get.`, 0, 9999)
        if (id === "mount") amount = Math.min(amount, gameData.mount.length)
        player.backpack.data[id] = itemify(gameData[id].filter(i => id === "follow" ? ![125, 126, 127, 128, 129, 134, 135, 136, 137].includes(i.ID) : i), amount)
        success(`You now have ${amount} of all ${name.toLocaleLowerCase()}.`)
    })
    hack("Selector (Advanced)", "Precisely pick the amount of an individual item you want to receive.", async (hack, player, gameData) => {
        const itemCategory = await InputTypes.select("Please select the category of items you want to get.", names)
        const itemCategoryId = ids[itemCategory]
        const itemCategoryOptions = gameData[itemCategoryId]
        const item = await InputTypes.select("Please select the item you want to get.", itemCategoryOptions.map(e => e.data.name))
        const itemData = itemCategoryOptions[item]
        const amount = await InputTypes.integer(`Please enter the amount of ${itemData.data.name} you want to get.`, 0, 9999)
        const indexOfItem = player.backpack.data[itemCategoryId].findIndex(i => i.ID === itemData.ID)
        if (indexOfItem === -1) {
            player.backpack.data[itemCategoryId].push({ ID: itemData.ID, N: amount })
        } else {
            player.backpack.data[itemCategoryId][indexOfItem].N = amount
        }
        success(`You now have ${amount} of ${itemData.data.name}.`)
    })
    hack("Delete Item", "Precisely delete an item from your inventory.", async (hack, player, gameData) => {
        const itemCategory = await InputTypes.select("Please select the category of items you want to remove.", names)
        const itemCategoryId = ids[itemCategory]
        const itemCategoryOptions = gameData[itemCategoryId].filter(e => player.backpack.data[itemCategoryId].some(f => e.ID === f.ID))
        const item = await InputTypes.select("Please select the item you want to remove.", itemCategoryOptions.map(e => e.data.name).sort((a, b) => a.localeCompare(b)))
        const itemData = itemCategoryOptions.sort((a, b) => a.data.name.localeCompare(b.data.name))[item]
        const amount = await InputTypes.integer(`Please enter the amount of ${itemCategoryOptions[item].data.name} you want to delete.`, 0, 9999)
        const indexOfItem = player.backpack.data[itemCategoryId].findIndex(i => i.ID === itemData.ID)
        if (amount >= player.backpack.data[itemCategoryId][indexOfItem].N) {
            player.backpack.data[itemCategoryId].splice(indexOfItem, 1)
        } else {
            player.backpack.data[itemCategoryId][indexOfItem].N -= amount
        }
    })
    hack("Obtain All Furniture", "Get's a certain amount of every furniture item.", async (hack, player, gameData) => {
        const value = await InputTypes.integer("Please enter the amount of every furniture item you want to get.", 0, 9999)
        gameData.dorm.forEach(x => {
            player.house.data.items[x.ID] = {
                A: [],
                N: value
            }
        })
        success(`You now have ${value} of every furniture item.`)
    })
    hack("Complete Rune Run", "Completing a rune run will give you an item. There is a chance this item is a rune.", async (hack, player, gameData) => {
        const token = `Bearer ${hack._input.onDown._bindings[0].context.jwtAuthProvider.getToken()}`
        const userID = hack._input.onDown._bindings[0].context.api.userID

        await fetch(`https://api.prodigygame.com/game-cortex-server/listBountyRuns?userID=${userID}`, {
            headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.9",
                authorization: token,
                "if-none-match": "W/\"1bc-f++5y4fDul2zBpKrYQ4UE61ANfg\"",
                "sec-ch-ua": "\".Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"103\", \"Chromium\";v=\"103\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                Referer: "https://math.prodigygame.com/", "https://ao28th28.github.io/", "https://daboss7173.github.io/",             
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            body: null,
            method: "GET"
        })

        const petIds: number[] = player.kennel._petTeam.map(e => parseInt(e.data.ID, 10)).filter(e => !isNaN(e))
        const teamCurrentHP: number[] = player.kennel._petTeam.map(e => e.getCurrentHearts())

        const bounty = await fetch("https://api.prodigygame.com/game-cortex-server/acceptBounty", {
            headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.9",
                authorization: token,
                "content-type": "application/json",
                "sec-ch-ua": "\".Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"103\", \"Chromium\";v=\"103\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                Referer: "https://math.prodigygame.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            body: `{"bountyIdx":1,"loadoutIdx":0,"pets":${JSON.stringify(petIds)},"userID":${userID}}`,
            method: "POST"
        })

        if (!bounty.ok) {
            await error("Could not start a rune run. Try reloading your page.")
            return
        }

        const battleRequest = await fetch("https://api.prodigygame.com/game-cortex-server/createBattle", {
            headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.9",
                authorization: token,
                "content-type": "application/json",
                "sec-ch-ua": "\".Prodigy/A)Brand\";v=\"99\", \"Google Chrome\";v=\"103\", \"Chromium\";v=\"103\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                Referer: "https://math.prodigygame.com/"
            },
            body: `{"type":"bounty-boss","teamCurrentHP":${JSON.stringify(teamCurrentHP)},"userID":${userID}}`,
            method: "POST"
        })

        if (!bounty.ok) {
            await error("Could not start a rune battle. Try reloading your page.")
            return
        }

        const battleData = await battleRequest.json()

        let actionData: any = {}

        for (let i = 0; i < 51; i++) {
            const actionRequest = await fetch("https://api.prodigygame.com/game-cortex-server/doBattleAction", {
                headers: {
                    accept: "*/*",
                    "accept-language": "en-US,en;q=0.9",
                    authorization: token,
                    "content-type": "application/json",
                    "sec-ch-ua": "\".Prodigy/A)Brand\";v=\"99\", \"Google Chrome\";v=\"103\", \"Chromium\";v=\"103\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    Referer: "https://math.prodigygame.com/"
                },
                body: `{"battleID":"${battleData.id}","actionID":"${crypto.randomUUID()}","action":"castSpell","data":{"id":54,"energy":0,"questionCorrect":true,"nFactor":9},"userID":${userID}}`,
                method: "POST"
            })

            if (!actionRequest.ok) break

            actionData = await actionRequest.json()

            if (actionData.status === "home-win") {
                break
            }
            await sleep(1000 + Math.random() * 500)
        }

        if (actionData.status === "home-win") {
            customMessage({
                title: "Success!",
                html: <div>
                    <p className="font-bold">You obtained these items:</p>
                    <ul className="list-disc list-inside">
                        {[...actionData.lootSecure, ...actionData.lootUnSecure].map((lootItem: LootItem) => {
                            // I'll pull a quote from Prodigy's source code
                            // Gold...our fabulous little currency that needs to be converted all the time
                            const itemData = lootItem.type === "gold"
                                ? gameData.currency.find(e => e.name === "Gold")
                                : gameData[lootItem.type].find(e => e.ID === lootItem.ID)

                            return (
                                <li key={lootItem.type + lootItem.ID}>
                                    {lootItem.quantity} of {itemData.data.name} <img className="m-auto block" height="40" width="40" src={`https://cdn.prodigygame.com/game/assets/v1_cache/single-images/icon-${itemData.type}-${itemData.ID}/${itemData.metadata.vIcon}/icon-${itemData.type}-${itemData.ID}.png`} />
                                </li>
                            )
                        })}
                    </ul>
                    <p className="font-bold">You may need to reload your page to be able to use this hack again.</p>
                </div>
            })
        } else {
            error("A problem occured in the battle. Make sure your wizard is in the first spot.")
            await fetch("https://api.prodigygame.com/game-cortex-server/abandonBounty", {
                headers: {
                    accept: "*/*",
                    "accept-language": "en-US,en;q=0.9",
                    authorization: token,
                    "content-type": "application/json",
                    "sec-ch-ua": "\".Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"103\", \"Chromium\";v=\"103\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    Referer: "https://math.prodigygame.com/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                body: `{"userID":${userID}}`,
                method: "POST"
            })
        }
    })
})
