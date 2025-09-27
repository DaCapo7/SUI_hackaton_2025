/*
TODO : 
payment
security
2 persons consenstneoiansdofkimae
date string->date

*/


/// Module: lovelock
module lovelock::lovelock;


// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

use std::string::String;


public struct Bridge has key{
    id: UID,
    locks: vector<Lock>,
}

public struct Lock has key, store{
    id: UID,
    p1: UID,
    p2: UID,
    message: String,
    creation_date: Date,
}

public struct Date has store{
    year: u16,
    month: u8,
    day: u8
}

/// `init` function is a special function that is called when the module
/// is published. It is a good place to do a setup for an application.
fun init(ctx: &mut TxContext) {
    let locks:vector<Lock> = vector[];
    
    let mut bridge = Bridge { id: object::new(ctx) , locks};

    // Transfer the object to the transaction sender.
    transfer::transfer(bridge, ctx.sender());
}

public fun create_date(day : u8, month : u8, y :u16): Date{
    let d = Date{year: y, month: month, day:day};
    (d)
}

public fun create_lock(
    bridge: &mut Bridge, ctx: &mut TxContext, p1: UID, p2: UID, message: String, day: u8, month: u8, y:u16){
    
    let current_date = create_date(day, month, y);

    let lock = Lock{
        id :object::new(ctx),
        p1: p1,
        p2: p2,
        message: message,
        creation_date: current_date,
    };

    bridge.locks.push_back(lock);
}