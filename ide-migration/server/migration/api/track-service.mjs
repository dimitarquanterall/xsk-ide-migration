/*
 * Copyright (c) 2021 SAP SE or an SAP affiliate company and XSK contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Apache License, v2.0
 * which accompanies this distribution, and is available at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-FileCopyrightText: 2021 SAP SE or an SAP affiliate company and XSK contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { dao } from "@dirigible/db";
import { user } from "@dirigible/security";
import { process } from "@dirigible/bpm";

const execution = process.getExecutionContext();
const userName = user.getName();
let migrationsTable;
let entryInstance;

export class TrackService {
    currentIndex = null;

    getCurrentMigrationIndex() {
        return this.currentIndex;
    }

    setupTable() {
        migrationsTable = dao.create(
            {
                table: "XSK_MIGRATIONS",
                properties: [
                    {
                        name: "id",
                        column: "ID",
                        type: "BIGINT",
                        id: true,
                    },
                    {
                        name: "executedBy",
                        column: "EXECUTED_BY",
                        type: "VARCHAR",
                        required: false,
                    },
                    {
                        name: "startedOn",
                        column: "STARTED_ON",
                        type: "TIMESTAMP",
                        required: false,
                    },
                    {
                        name: "lastUpdated",
                        column: "LAST_UPDATED",
                        type: "TIMESTAMP",
                        required: false,
                    },
                    {
                        name: "status",
                        column: "STATUS",
                        type: "VARCHAR",
                        required: false,
                    },
                    {
                        name: "processInstanceId",
                        column: "PROCESS_INSTANCE_ID",
                        type: "VARCHAR",
                        required: false,
                    },
                    {
                        name: "workspaceName",
                        column: "WORKSPACE_NAME",
                        type: "VARCHAR",
                        required: false,
                    },
                    {
                        name: "duString",
                        column: "DU_STRING",
                        type: "VARCHAR",
                        required: false,
                    },
                ],
            },
            null,
            "DefaultDB",
            "local"
        );

        if (!migrationsTable.existsTable()) {
            migrationsTable.createTable();
        }
    }

    updateMigrationStatus(status) {
        this.setupTable();
        try {
            let entryToUpdate = migrationsTable.find(process.getVariable(execution.getId(), "migrationIndex"));
            let startedOn = entryToUpdate.startedOn;
            entryToUpdate.lastUpdated = Date.now();
            entryToUpdate.startedOn = Date.parse(startedOn);
            entryToUpdate.status = status;
            migrationsTable.update(entryToUpdate);
            entryInstance = entryToUpdate;
        } catch (e) {
            throw new Error("Cant update migration status. Reason: " + e);
        }
    }

    updateProcessInstanceId(entryInstance, processInstanceId) {
        this.setupTable();
        try {
            let entryToUpdate = migrationsTable.find(entryInstance);
            console.log(JSON.parse(JSON.stringify(entryToUpdate)));
            entryToUpdate.processInstanceId = processInstanceId;
            entryToUpdate.lastUpdated = Date.now();
            entryToUpdate.startedOn = Date.parse(entryToUpdate.startedOn);
            migrationsTable.update(entryToUpdate);
            entryInstance = entryToUpdate;
        } catch (e) {
            throw new Error("Cant update migration instance id. Reason: " + e);
        }
    }

    addEntry(status) {
        this.setupTable();
        try {
            entryInstance = migrationsTable.insert({
                executedBy: userName,
                startedOn: Date.now(),
                lastUpdated: Date.now(),
                status: status
            });
            this.currentIndex = entryInstance;
        } catch (e) {
            throw new Error("Cant add new migration entry. Reason: " + e);
        }
    }

    updateMigrationTarget(workspaceName, du) {
        this.setupTable();
        try {
            let entryToUpdate = migrationsTable.find(process.getVariable(execution.getId(), "migrationIndex"));
            entryToUpdate.lastUpdated = Date.now();
            entryToUpdate.startedOn = Date.parse(entryToUpdate.startedOn);
            entryToUpdate.workspaceName = workspaceName;
            entryToUpdate.duString = JSON.stringify(du.map((d) => { return { name: d.name } })); //we only need the names and the entire object is too large
            migrationsTable.update(entryToUpdate);
            entryInstance = entryToUpdate;
        } catch (e) {
            throw new Error("Cant update migration instance id. Reason: " + e);
        }
    }
}
