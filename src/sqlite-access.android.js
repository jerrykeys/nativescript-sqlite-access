import * as app from '@nativescript/core/application';
import { parseToDbValue, parseToJsValue, ExtendedPromise } from './sqlite-access.common';
let _db;
let _dataReturnedType;
class SqliteAccess {
    constructor(db, returnType) {
        _db = db;
        _dataReturnedType = returnType;
    }
    insert(table, values) {
        return _db.insert(table, null, __mapToContentValues(values));
    }
    replace(table, values) {
        return _db.replace(table, null, __mapToContentValues(values));
    }
    update(table, values, whereClause, whereArs) {
        console.log(__objectArrayToStringArray(whereArs));
        return _db.update(table, __mapToContentValues(values), whereClause, __objectArrayToStringArray(whereArs));
    }
    delete(table, whereClause, whereArgs) {
        return _db.delete(table, whereClause, __objectArrayToStringArray(whereArgs));
    }
    select(sql, params) {
        return new ExtendedPromise(function (subscribers, resolve, reject) {
            try {
                let cursor = _db.rawQuery(sql, __objectArrayToStringArray(params));
                const result = __processCursor(cursor, _dataReturnedType, subscribers.shift());
                resolve(result);
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    query(table, columns, selection, selectionArgs, groupBy, orderBy, limit) {
        return new ExtendedPromise(function (subscribers, resolve, error) {
            let cursor = _db.query(table, columns, selection, __objectArrayToStringArray(selectionArgs), groupBy, orderBy, limit);
            try {
                const result = __processCursor(cursor, _dataReturnedType, subscribers.shift());
                resolve(result);
            }
            catch (ex) {
                error(ex);
            }
        });
    }
    execSQL(sql) {
        _db.execSQL(sql);
    }
    beginTransact() {
        _db.beginTransaction();
    }
    commit() {
        _db.setTransactionSuccessful();
        _db.endTransaction();
    }
    rollback() {
        _db.endTransaction();
    }
    close() {
        if (_db === null) {
            return;
        }
        _db.close();
        _db = null;
    }
}
function __processCursor(cursor, returnType, reduceOrMapSub) {
    let result = reduceOrMapSub && reduceOrMapSub.initialValue || [];
    if (cursor.getCount() > 0) {
        let dbValue = null;
        while (cursor.moveToNext()) {
            dbValue = __getRowValues(cursor, returnType);
            if (reduceOrMapSub) {
                if (reduceOrMapSub.initialValue) {
                    result = reduceOrMapSub.callback(result, dbValue, cursor.getPosition());
                    continue;
                }
                dbValue = reduceOrMapSub.callback(dbValue, cursor.getPosition());
            }
            result.push(dbValue);
        }
    }
    cursor.close();
    return result;
}
function __getRowValues(cursor, returnType) {
    let rowValue = {};
    if (returnType === 1) {
        rowValue = [];
    }
    let primitiveType = null;
    let columnName = '';
    let value = null;
    let columnCount = cursor.getColumnCount();
    for (let i = 0; i < columnCount; i++) {
        primitiveType = cursor.getType(i);
        columnName = cursor.getColumnName(i);
        switch (primitiveType) {
            case android.database.Cursor.FIELD_TYPE_INTEGER:
                value = cursor.getLong(i);
                break;
            case android.database.Cursor.FIELD_TYPE_FLOAT:
                value = Number(cursor.getString(i));
                break;
            case android.database.Cursor.FIELD_TYPE_STRING:
                value = cursor.getString(i);
                value = parseToJsValue(value);
                break;
            case android.database.Cursor.FIELD_TYPE_BLOB:
                continue;
            case android.database.Cursor.FIELD_TYPE_NULL:
                value = null;
                break;
        }
        if (Array.isArray(rowValue) && returnType === 1) {
            rowValue.push(value);
            continue;
        }
        rowValue[columnName] = value;
    }
    return rowValue;
}
function __openCreateDataBase(dbName, mode) {
    if (dbName === ":memory:") {
        return android.database.sqlite.SQLiteDatabase.create(null);
    }
    const file = __getContext().getDatabasePath(dbName);
    if (!file.exists()) {
        file.getParentFile().mkdirs();
        file.getParentFile().setReadable(true);
        file.getParentFile().setWritable(true);
    }
    mode = mode | android.database.sqlite.SQLiteDatabase.CREATE_IF_NECESSARY;
    return android.database.sqlite.SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, mode);
}
function __objectArrayToStringArray(params) {
    if (!params)
        return null;
    let stringArray = [];
    let value = null;
    for (let i = 0, len = params.length; i < len; i++) {
        value = parseToDbValue(params[i]);
        if (value === null) {
            stringArray.push(value);
            continue;
        }
        stringArray.push(value.toString().replace(/''/g, "'").replace(/^'|'$/g, ''));
    }
    return stringArray;
}
function __mapToContentValues(values) {
    let contentValues = new android.content.ContentValues();
    let value = null;
    for (const key in values) {
        if (values.hasOwnProperty(key)) {
            value = parseToDbValue(values[key]);
            if (value === null) {
                contentValues.putNull(key);
                continue;
            }
            contentValues.put(key, value.toString().replace(/''/g, "'").replace(/^'|'$/g, ''));
        }
    }
    return contentValues;
}
function __getContext() {
    return (app.android.context
        || (app.getNativeApplication && app.getNativeApplication()));
}
export function DbBuilder(dbName, options) {
    if (!dbName)
        throw "Must specify a db name";
    options = options || {
        version: 1
    };
    options.version = options.version || 1;
    options.returnType = options.returnType || 0;
    const db = __openCreateDataBase(dbName, android.database.sqlite.SQLiteDatabase.OPEN_READWRITE);
    const curVersion = db.getVersion();
    if (options.version > curVersion) {
        db.setVersion(options.version);
        const tableCreateScripts = options.createTableScriptsFn && options.createTableScriptsFn();
        const tableDroptScripts = options.dropTableScriptsFn && options.dropTableScriptsFn();
        try {
            if (tableDroptScripts && curVersion > 0) {
                for (let script in tableDroptScripts) {
                    db.execSQL(tableDroptScripts[script]);
                }
            }
            if (tableCreateScripts) {
                for (let script in tableCreateScripts) {
                    db.execSQL(tableCreateScripts[script]);
                }
            }
        }
        catch (error) {
            db.setVersion(curVersion);
            db.close();
            throw error;
        }
    }
    else if (options.version < curVersion) {
        db.close();
        throw `It is not possible to set the version ${options.version} to database, because is lower then current version, Db current version is ${curVersion}`;
    }
    return new SqliteAccess(db, options.returnType);
}
export * from "./sqlite-access.common";
//# sourceMappingURL=sqlite-access.android.js.map