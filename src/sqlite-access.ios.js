import * as fs from '@nativescript/core/file-system';
import { parseToDbValue, parseToJsValue, ExtendedPromise } from './sqlite-access.common';
let _db;
let _dataReturnedType;
class SqliteAccess {
    constructor(db, returnType) {
        _db = db;
        _dataReturnedType = returnType;
    }
    insert(tableName, values) {
        this.execSQL(`INSERT INTO ${tableName} (${Object.keys(values).join(",")}) VALUES(${__mapToAddOrUpdateValues(values, true)})`);
        let value = sqlite3_last_insert_rowid(_db.value);
        return Number(value);
    }
    replace(tableName, values) {
        this.execSQL(`REPLACE INTO ${tableName} (${Object.keys(values).join(",")}) VALUES(${__mapToAddOrUpdateValues(values, true)})`);
        let value = sqlite3_changes(_db.value);
        return Number(value);
    }
    update(tableName, values, whereClause, whereArs) {
        whereClause = whereClause && "WHERE " + whereClause.replace(/\?/g, __replaceQuestionMarkForParams(whereArs)) || "";
        this.execSQL(`UPDATE ${tableName} SET ${__mapToAddOrUpdateValues(values, false)} ${whereClause}`);
        let value = sqlite3_changes(_db.value);
        return Number(value);
    }
    delete(tableName, whereClause, whereArgs) {
        whereClause = whereClause && "WHERE " + whereClause.replace(/\?/g, __replaceQuestionMarkForParams(whereArgs)) || "";
        this.execSQL(`DELETE FROM ${tableName} ${whereClause}`);
        let value = sqlite3_changes(_db.value);
        return Number(value);
    }
    select(sql, conditionParams) {
        return new ExtendedPromise(function (subscribers, resolve, error) {
            try {
                sql = sql.replace(/\?/g, __replaceQuestionMarkForParams(conditionParams));
                let cursor = __execQueryAndReturnStatement(sql, _db);
                const result = __processCursor(cursor, _dataReturnedType, subscribers.shift());
                resolve(result);
            }
            catch (ex) {
                error(ex);
            }
        });
    }
    query(tableName, columns, selection, selectionArgs, groupBy, orderBy, limit) {
        selection = selection && "WHERE " + selection.replace(/\?/g, __replaceQuestionMarkForParams(selectionArgs)) || "";
        groupBy = groupBy && "GROUP BY " + groupBy || "";
        orderBy = orderBy && "ORDER BY " + orderBy || "";
        limit = limit && "LIMIT " + limit || "";
        const _columns = columns && columns.join(',') || `${tableName}.*`;
        let query = `SELECT ${_columns} FROM ${tableName} ${selection} ${groupBy} ${orderBy} ${limit}`;
        return new ExtendedPromise(function (subscribers, resolve, error) {
            try {
                let cursor = __execQueryAndReturnStatement(query, _db);
                const result = __processCursor(cursor, _dataReturnedType, subscribers.shift());
                resolve(result);
            }
            catch (ex) {
                error(`ErrCode:${ex}`);
            }
        });
    }
    execSQL(sql) {
        let cursorRef;
        cursorRef = __execQueryAndReturnStatement(sql, _db);
        sqlite3_finalize(cursorRef.value);
    }
    beginTransact() {
        this.execSQL("BEGIN TRANSACTION");
    }
    commit() {
        this.execSQL("COMMIT TRANSACTION");
    }
    rollback() {
        this.execSQL("ROLLBACK TRANSACTION");
    }
    close() {
        if (_db === null) {
            return;
        }
        sqlite3_close(_db.value);
        _db = null;
    }
}
function __execQueryAndReturnStatement(sql, dbPointer) {
    let cursorRef = new interop.Reference();
    let resultCode = sqlite3_prepare_v2(dbPointer.value, sql, -1, cursorRef, null);
    let applyStatementCode = sqlite3_step(cursorRef.value);
    if (resultCode !== 0 || (applyStatementCode !== 101 && applyStatementCode !== 100)) {
        sqlite3_finalize(cursorRef.value);
        cursorRef.value = null;
        cursorRef = null;
        throw NSString.stringWithUTF8String(sqlite3_errmsg(dbPointer.value)).toString();
    }
    return cursorRef.value;
}
function __replaceQuestionMarkForParams(whereParams) {
    let counter = 0;
    return () => {
        return parseToDbValue(whereParams[counter++]);
    };
}
function __processCursor(cursorRef, returnType, reduceOrMapSub) {
    let result = reduceOrMapSub && reduceOrMapSub.initialValue || [];
    let dbValue = null, hasData = sqlite3_data_count(cursorRef) > 0;
    if (hasData) {
        let counter = 0;
        do {
            dbValue = __getRowValues(cursorRef, returnType);
            if (reduceOrMapSub) {
                if (reduceOrMapSub.initialValue) {
                    result = reduceOrMapSub.callback(result, dbValue, counter++);
                    continue;
                }
                dbValue = reduceOrMapSub.callback(dbValue, counter++);
            }
            result.push(dbValue);
        } while (sqlite3_step(cursorRef) === 100);
    }
    sqlite3_finalize(cursorRef);
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
    let columnCount = sqlite3_column_count(cursor);
    for (let i = 0; i < columnCount; i++) {
        primitiveType = sqlite3_column_type(cursor, i);
        columnName = sqlite3_column_name(cursor, i);
        columnName = NSString.stringWithUTF8String(columnName).toString();
        switch (primitiveType) {
            case 1:
                value = sqlite3_column_int64(cursor, i);
                break;
            case 2:
                value = sqlite3_column_double(cursor, i);
                break;
            case 3:
                value = sqlite3_column_text(cursor, i);
                value = NSString.stringWithUTF8String(value).toString();
                value = parseToJsValue(value);
                break;
            case 4:
                continue;
            case 5:
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
    const dbInstance = new interop.Reference();
    let resultCode = 0;
    if (dbName === ":memory:") {
        resultCode = sqlite3_open_v2(dbName, dbInstance, mode | 296, null);
    }
    else {
        dbName = `${fs.knownFolders.documents().path}/${dbName}`;
        mode = mode | 4;
        resultCode = sqlite3_open_v2(dbName, dbInstance, mode, null);
    }
    if (resultCode !== 0) {
        throw `Could not open database. sqlite error code ${resultCode}`;
    }
    return dbInstance;
}
function __mapToAddOrUpdateValues(values, inserting = true) {
    let contentValues = [];
    for (const key in values) {
        if (values.hasOwnProperty(key)) {
            let value = parseToDbValue(values[key]);
            value = value === null ? 'null' : value;
            contentValues.push(inserting ? value : `${key}=${value}`);
        }
    }
    return contentValues.join(",");
}
export function DbBuilder(dbName, options) {
    if (!dbName)
        throw "Must specify a db name";
    options = options || ({
        version: 1
    });
    options.version = options.version || 1;
    options.returnType = options.returnType || 0;
    const db = __openCreateDataBase(dbName, 2);
    const currVersion = __dbVersion(db);
    if (options.version > currVersion) {
        __dbVersion(db, options.version);
        const tableCreateScripts = options.createTableScriptsFn && options.createTableScriptsFn();
        const tableDroptScripts = options.dropTableScriptsFn && options.dropTableScriptsFn();
        try {
            if (tableDroptScripts && currVersion > 0) {
                for (let script in tableDroptScripts) {
                    const cursorRef = __execQueryAndReturnStatement(tableDroptScripts[script], db);
                    sqlite3_finalize(cursorRef);
                }
            }
            if (tableCreateScripts) {
                for (let script in tableCreateScripts) {
                    const cursorRef = __execQueryAndReturnStatement(tableCreateScripts[script], db);
                    sqlite3_finalize(cursorRef);
                }
            }
        }
        catch (error) {
            __dbVersion(db, currVersion);
            sqlite3_close(db);
            throw error;
        }
    }
    else if (options.version < currVersion) {
        sqlite3_close(db);
        throw `It is not possible to set the version ${options.version} to database, because is lower then current version, Db current version is ${currVersion}`;
    }
    return new SqliteAccess(db, options.returnType);
}
function __dbVersion(db, version) {
    let sql = "PRAGMA user_version";
    if (isNaN(version)) {
        version = __execQueryReturnOneArrayRow(db, sql).pop();
    }
    else {
        const cursorRef = __execQueryAndReturnStatement(`${sql}=${version}`, db);
        sqlite3_finalize(cursorRef);
    }
    return version;
}
function __execQueryReturnOneArrayRow(db, query) {
    const cursorRef = __execQueryAndReturnStatement(query, db);
    const result = __processCursor(cursorRef, 1);
    return result.shift();
}
export * from "./sqlite-access.common";
//# sourceMappingURL=sqlite-access.ios.js.map