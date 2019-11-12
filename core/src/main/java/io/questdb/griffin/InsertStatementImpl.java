/*******************************************************************************
 *    ___                  _   ____  ____
 *   / _ \ _   _  ___  ___| |_|  _ \| __ )
 *  | | | | | | |/ _ \/ __| __| | | |  _ \
 *  | |_| | |_| |  __/\__ \ |_| |_| | |_) |
 *   \__\_\\__,_|\___||___/\__|____/|____/
 *
 * Copyright (C) 2014-2019 Appsicle
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 ******************************************************************************/

package io.questdb.griffin;

import io.questdb.cairo.CairoEngine;
import io.questdb.cairo.TableWriter;
import io.questdb.cairo.sql.*;
import io.questdb.std.Misc;
import io.questdb.std.ObjList;

public class InsertStatementImpl implements InsertStatement {
    private final VirtualRecord virtualRecord;
    private final SqlCompiler.RecordToRowCopier copier;
    private final Function timestampFunction;
    private final RowFactory rowFactory;
    private final long structureVersion;
    private final String tableName;
    private final InsertMethodImpl insertMethod = new InsertMethodImpl();
    private final CairoEngine engine;
    private SqlExecutionContext lastUsedContext;

    // todo: recycle these
    public InsertStatementImpl(
            CairoEngine engine,
            String tableName,
            VirtualRecord virtualRecord,
            SqlCompiler.RecordToRowCopier copier,
            Function timestampFunction,
            long structureVersion
    ) {
        this.engine = engine;
        this.tableName = tableName;
        this.virtualRecord = virtualRecord;
        this.copier = copier;
        this.timestampFunction = timestampFunction;
        if (timestampFunction != null) {
            rowFactory = this::getRowWithTimestamp;
        } else {
            rowFactory = this::getRowWithoutTimestamp;
        }
        this.structureVersion = structureVersion;
    }

    @Override
    public long getStructureVersion() {
        return structureVersion;
    }

    @Override
    public String getTableName() {
        return tableName;
    }

    private TableWriter.Row getRowWithTimestamp(TableWriter tableWriter) {
        return tableWriter.newRow(timestampFunction.getTimestamp(null));
    }

    private TableWriter.Row getRowWithoutTimestamp(TableWriter tableWriter) {
        return tableWriter.newRow();
    }

    private void initContext(SqlExecutionContext executionContext) {
        lastUsedContext = executionContext;
        final ObjList<? extends Function> functions = virtualRecord.getFunctions();
        for (int i = 0, n = functions.size(); i < n; i++) {
            functions.getQuick(i).init(null, executionContext);
        }
        if (timestampFunction != null) {
            timestampFunction.init(null, executionContext);
        }
    }

    @Override
    public InsertMethod createMethod(SqlExecutionContext executionContext) {
        if (lastUsedContext != executionContext) {
            initContext(executionContext);
        }

        final TableWriter writer = engine.getWriter(executionContext.getCairoSecurityContext(), tableName);
        if (writer.getStructureVersion() != getStructureVersion()) {
            writer.close();
            throw WriterOutOfDateException.INSTANCE;
        }
        insertMethod.writer = writer;
        return insertMethod;
    }

    @FunctionalInterface
    private interface RowFactory {
        TableWriter.Row getRow(TableWriter tableWriter);
    }

    private class InsertMethodImpl implements InsertMethod {
        private TableWriter writer = null;

        @Override
        public void execute() {
            final TableWriter.Row row = rowFactory.getRow(writer);
            copier.copy(virtualRecord, row);
            row.append();
        }

        @Override
        public void commit() {
            writer.commit();
        }

        @Override
        public void close() {
            writer = Misc.free(writer);
        }
    }
}