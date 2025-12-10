const Players = {}
const Fleets = {}
const Sharks = {}
const Bullets = [];
const Scores = [];
const Offers = [];
const Crates = [];
const Pumps = []

const HostableRooms = {
    pvp: {
        key: 'open_pvp'
    }
};

const ServerExtraData = {
    BootTime: Date.now()
}

const Islands = [
    { name: 'Jamaica', pos: { x: 0, y: -1, z: 0 } },
    { name: 'Bahamas', pos: { x: 500, y: -1, z: 500 } },
    { name: 'Cuba', pos: { x: -500, y: -1, z: 500 } },
    { name: 'Tobago', pos: { x: -500, y: -1, z: -500 } },
    { name: 'Niger', pos: { x: 500, y: -1, z: -500 } }
];

const WordFilterArray = [
    "http://", "https://", ".com", ".net", ".org", "www.", "bit.ly", "tinyurl",
    "freegift", "clickhere", "subscribe", "giveaway",
    "discord.gg", "t.me", "telegram.me", "whatsapp.com",

    "porn", "hentai", "adult", "sexvideo", "sexshop", "nude",
    "nsfw", "erotic", "fetish", "gangbang", "milf", "hardcore",
    "anal", "blowjob", "cumshot", "boobs", "pussy", "dildo", "vibrator", "orgy",

    "chink", "retard", "faggot", "slut",
    "bitch", "whore", "cunt", "dumbass", "asshole", "bastard", "idiot",

    "murder", "rape", "suicide", "bomb", "drugs",

    "fuck urmom", "fuck ur mom", "kill yourself"
];

const ShopVehicles = {
    s1: {
        id: 1,
        name: 'raft1',
        price: 50,
        health: 300,
        regen: 1,
        crew: 1,
        maxCrew: 2,
        cargo: 0,
        maxCargo: 10, 
        speed: 9,
        ModelWidth: 6,
        ModelLength: 8,
        ModelHitBoxes: {},
        SteerHit: 2,
        RotationSpeed: 0.02,
        airspace: false
    },
    s2: {
        id: 2,
        name: 'raft2',
        price: 2500,
        health: 500,
        regen: 1,
        crew: 4,
        maxCrew: 2,
        cargo: 0,
        maxCargo: 30,
        speed: 8,
        ModelWidth: 9,
        ModelLength: 13,
        ModelHitBoxes: {},
        SteerHit: 2.8,
        RotationSpeed: 0.01,
        airspace: false
    },
    s3: {
        id: 3,
        name: 'raft3',
        price: 8000,
        health: 850,
        regen: 2,
        crew: 4,
        maxCrew: 6,
        cargo: 0,
        maxCargo: 60,
        speed: 8,
        ModelWidth: 14,
        ModelLength: 16,
        ModelHitBoxes: {},
        SteerHit: 4,
        RotationSpeed: 0.008,
        airspace: false
    },
    s4: {
        id: 4,
        name: "Boat1",
        price: 15000,
        health: 800,
        regen: 2,
        crew: 10,
        maxCrew: 6,
        cargo: 0,
        maxCargo: 200,
        speed: 7,
        ModelWidth: 8,
        ModelLength: 15,
        ModelHitBoxes: {},
        SteerHit: 2.2,
        RotationSpeed: 0.008,
        airspace: false
    },
        s5: {
        id: 5,
        name: "Boat2",
        price: 30000,
        health: 1250,
        regen: 2,
        crew: 10,
        maxCrew: 8,
        cargo: 0,
        maxCargo: 400,
        speed: 7,
        ModelWidth: 8,
        ModelLength: 15,
        ModelHitBoxes: {},
        SteerHit: 2.2,
        RotationSpeed: 0.008,
        airspace: false
    },
        s6: {
        id: 6,
        name: "Boat3",
        price: 45000,
        health: 1600,
        regen: 2,
        crew: 10,
        maxCrew: 10,
        cargo: 0,
        maxCargo: 600,
        speed: 7,
        ModelWidth: 8,
        ModelLength: 15,
        ModelHitBoxes: {},
        SteerHit: 2.2,
        RotationSpeed: 0.008,
        airspace: false
    }
};


module.exports = {
    Players,
    Fleets,
    Bullets,
    Scores,
    Islands,
    ShopVehicles,
    HostableRooms,
    Sharks,
    WordFilterArray,
    ServerExtraData,
    Offers,
    Crates,
    Pumps
}