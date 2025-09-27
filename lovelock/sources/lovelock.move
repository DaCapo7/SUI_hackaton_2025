/// Module: lovelock
///
/// This module allows users to create "padlocks" (immutable Lock objects) that are
/// stored permanently on the blockchain. Locks are grouped under a Bridge. Payments
/// in SUI coins are required to create locks, and all locks include metadata such
/// as participants, messages, and creation date.
module lovelock::lovelock;

use bridge::bridge;
use std::string::String;
use sui::coin::{Coin, value, split};
use sui::sui::{Self, SUI};
use sui::transfer;

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

const LOCK_PRICE: u64 = 390_000_000;
const ERR_NOT_ENOUGH_COINS: u64 = 1001;
const ERR_NOT_SAME_ID: u64 = 6942;
const ERR_LOCK_NOT_CLOSED: u64 = 2020;

/// A Bridge represents a collection of Locks. All payments goes to the master's
/// address.
public struct Bridge has key {
    id: UID,
    master: address,
}

/// A Lock represents a padlock on the blockchain.
/// When a padlock is published and accepted, it can not further be
/// modified : it stays on the bridge forever.
/// Each Lock has 2 participants, a message, and a creation date.
///
/// When someone creates a lock, they pay a LOCK_PRICE price that is stored in the coin
/// then the coin is sent to the chosen participant who has to accept the request
/// if he accepts it the coin stored in the lock go to bridge's master and the
/// lock goes to the bridge and stays here forever
public struct Lock has key {
    id: UID,
    p1: address,
    p2: address,
    message: String,
    creation_date: Date,
    closed: bool,
    coin: Option<Coin<SUI>>,
}

///simple date struct to store the creation date of a lock
public struct Date has drop, store {
    year: u16,
    month: u8,
    day: u8,
}

/// creation of a bridge that is sent to shared state
/// the bridge has a master who gets all the earnings
fun init(ctx: &mut TxContext) {
    let mut bridge = Bridge { id: object::new(ctx), master: ctx.sender() };
    transfer::share_object(bridge);
}

/// Creates a Date object from the given day, month, and year.
///
/// # Parameters
/// - "day": day of the month (1-31)
/// - "month": month (1-12)
/// - "y": year
/// # Returns
/// - "Date" object representing the specified calendar date.
fun create_date(day: u8, month: u8, y: u16): Date {
    let d = Date { year: y, month: month, day: day };
    (d)
}

/// opened lock creation : p1 is the caller, p2 is chosen by p1, p1 pays LOCK_PRICE amount
/// but it will be given back if p2 declines
/// The created lock is then sent to p2
public fun create_lock(
    bridge: &mut Bridge,
    p2: address,
    message: String,
    day: u8,
    month: u8,
    y: u16,
    mut payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(value(&payment) >= LOCK_PRICE, ERR_NOT_ENOUGH_COINS);
    let lock_payment = split(&mut payment, LOCK_PRICE, ctx);
    transfer::public_transfer(payment, ctx.sender());

    let current_date = create_date(day, month, y);
    let mut option_payment: Option<Coin<SUI>> = option::some(lock_payment);

    let lock = Lock {
        id: object::new(ctx),
        p1: ctx.sender(),
        p2: p2,
        message: message,
        creation_date: current_date,
        closed: false,
        coin: option_payment,
    };

    transfer::transfer(lock, p2);
}

/// When p2 receives a lock, they can accept or decline it (true/false = accept)
/// accept : payment is sent to bridge's master, lock is sent to bridge for eternity
/// decline : lock is destroyed, payment is sent back to p1
public fun choose_fate_lock(
    mut lock: Lock,
    bridge: &mut Bridge,
    accept: bool,
    ctx: &mut TxContext,
) {
    assert!(ctx.sender()==lock.p2, ERR_NOT_SAME_ID);
    assert!(lock.closed == false, ERR_LOCK_NOT_CLOSED);

    if (accept) {
        lock.closed = true;
        transfer::public_transfer(lock.coin.extract(), bridge.master);
        let obj_id: ID = object::id(bridge);
        transfer::transfer(lock, object::id_to_address(&obj_id));
    } else {
        let Lock {
            id: id,
            p1: p1,
            p2: _,
            message: _,
            creation_date: _,
            closed: _,
            coin: mut extracted,
        } = lock;

        if (extracted.is_some()) {
            let c = extracted.extract();
            transfer::public_transfer(c, p1);
        };
        extracted.destroy_none();
        id.delete();
    }
}
