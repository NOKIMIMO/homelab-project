package com.homelab.core.model.action

enum class ActionsEnum {
    UPLOAD_FILE,
    GET_FILE,

//    CRUD actions
//    maybe make them become default to some types?
    CREATE,
    UPDATE,
    PUT, // READ => if r = 0 then CREATE else UPDATE (full)
    READ,
    LIST,
    DELETE
}