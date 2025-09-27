/*
TODO : 
payment
security
2 persons consenstneoiansdofkimae
date string->date

*/


/// Module: lovelock
/// 
/// This module allows users to create "padlocks" (immutable Lock objects) that are
/// stored permanently on the blockchain. Locks are grouped under a Bridge. Payments 
/// in SUI coins are required to create locks, and all locks include metadata such 
/// as participants, messages, and creation date.
module lovelock::lovelock;


use std::string::String;
use sui::coin::{Coin, value, split};
use sui::sui::SUI;

const LOCK_PRICE: u64 = 390_000_000;
const ERR_NOT_ENOUGH_COINS: u64 = 1001;

/// A Bridge represents a collection of Locks. All payments goes to the owner's 
/// address.
public struct Bridge has key{
    id: UID,
    owner: address,
    locks: vector<Lock>,
}

/// A Lock represents an immutable padlock on the blockchain.
/// When a padlock is published, it can not further be modified.
/// Each Lock has participants, a message, and a creation date.
private struct Lock has key, store{
    id: UID,
    p1: UID,
    p2: UID,
    message: String,
    creation_date: Date,
}

/// A simple struct representing internally a calendar date.
private struct Date has store{
    year: u16,
    month: u8,
    day: u8
}

/// Initializes the module by creating a Bridge object for the transaction sender.
/// This Bridge will hold all locks.
fun init(ctx: &mut TxContext) {
    let locks:vector<Lock> = vector[];
    
    let mut bridge = Bridge { id: object::new(ctx) , owner: ctx.sender(), locks};

    // Transfer the object to the transaction sender.
    transfer::transfer(bridge, ctx.sender());
}

/// Creates a Date object from the given day, month, and year.
///
/// # Parameters
/// - "day": day of the month (1-31)
/// - "month": month (1-12)
/// - "y": year
/// # Returns
/// - "Date" object representing the specified calendar date.
public fun create_date(day : u8, month : u8, y :u16): Date{
    let d = Date{year: y, month: month, day:day};
    (d)
}

/// Creates a Lock and adds it to a Bridge, transferring the required SUI payment
/// to the Bridge owner. Throws an error if payment < LOCK_PRICE.
///
public fun create_lock(
    bridge: &mut Bridge,
     ctx: &mut TxContext,
     p1: UID,
     p2: UID,
     message: String,
    day: u8,
    month: u8,
    y:u16,
    mut payment: Coin<SUI>) {

    assert!(value(&payment) >= LOCK_PRICE, ERR_NOT_ENOUGH_COINS);
    let lock_payment = split(&mut payment, LOCK_PRICE, ctx);
    transfer::public_transfer(lock_payment, bridge.owner);
    transfer::public_transfer(payment, ctx.sender());

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
