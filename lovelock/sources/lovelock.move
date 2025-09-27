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
use sui::coin::{Coin, value, split};
use sui::transfer;
use sui::sui;
use sui::sui::SUI;
use bridge::bridge;


const LOCK_PRICE: u64 = 390_000_000;
const ERR_NOT_ENOUGH_COINS: u64 = 1001;
const ERR_NOT_SAME_ID: u64 = 6942;

public struct Bridge has key{
    id: UID,
    master: address,
    locks: vector<Lock>,
}

public struct Lock has key, store{
    id: UID,
    p1: address,
    p2: address,
    message: String,
    creation_date: Date,
    closed: bool,
    coin: Option<Coin<SUI>>,
}

public struct Date has drop, store{
    year: u16,
    month: u8,
    day: u8
}

/// `init` function is a special function that is called when the module
/// is published. It is a good place to do a setup for an application.
fun init(ctx: &mut TxContext) {
    let locks:vector<Lock> = vector[];
    
    let mut bridge = Bridge { id: object::new(ctx) , master: ctx.sender(), locks};

    // Transfer the object to the transaction sender.
    //transfer::transfer(bridge, ctx.sender());
    transfer::share_object(bridge);
}

fun create_date(day : u8, month : u8, y :u16): Date{
    let d = Date{year: y, month: month, day:day};
    (d)
}

public fun create_lock(
    bridge: &mut Bridge,
    p2: address,
    message: String,
    day: u8,
    month: u8,
    y:u16,
    mut payment: Coin<SUI>,
    ctx: &mut TxContext) {

    assert!(value(&payment) >= LOCK_PRICE, ERR_NOT_ENOUGH_COINS);
    let lock_payment = split(&mut payment, LOCK_PRICE, ctx);
    //transfer::public_transfer(lock_payment, bridge.owner);
    transfer::public_transfer(payment, ctx.sender());

    let current_date = create_date(day, month, y);
    let mut option_payment: Option<Coin<SUI>> = option::some(lock_payment);

    let lock = Lock{
        id :object::new(ctx),
        p1: ctx.sender(),
        p2: p2,
        message: message,
        creation_date: current_date,
        closed: false,
        coin: option_payment,
    };

    bridge.locks.push_back(lock);
}

public fun choose_fate_lock(lock: &mut Lock, bridge: &mut Bridge, accept: bool, ctx: &mut TxContext){
    assert!(ctx.sender()==lock.p2, ERR_NOT_SAME_ID);

    if(accept){
        lock.closed = true;
        transfer::public_transfer(lock.coin.extract(), bridge.master);
    }else{
        
        
        let (_found, position) = bridge.locks.index_of(lock);
        let lock2: Lock = bridge.locks.remove(position);
        let Lock{id: id,p1: _,p2: _,message: _,creation_date: _, closed:_ ,coin: mut extracted} = lock2;

        if(extracted.is_some()){
            let c = extracted.extract();
            transfer::public_transfer(c, lock.p1);
        };
        extracted.destroy_none();
    
        id.delete();
    }


}
