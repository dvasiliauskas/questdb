package com.questdb.net.udp.client;

import com.questdb.misc.Chars;
import com.questdb.misc.Files;
import com.questdb.misc.Net;
import com.questdb.misc.Unsafe;
import com.questdb.std.str.CharSink;
import com.questdb.txt.sink.AbstractCharSink;

import java.io.Closeable;

public class LineProtoSender extends AbstractCharSink implements Closeable {
    private final int capacity;
    private final long bufA;
    private final long bufB;
    private final long sockaddr;
    private final long fd;

    private long lo;
    private long hi;
    private long ptr;
    private long lineStart;
    private boolean hasMetric = false;
    private boolean noFields = true;

    public LineProtoSender(CharSequence ipv4Address, int port, int capacity) {
        this.capacity = capacity;
        sockaddr = Net.sockaddr(ipv4Address, port);
        fd = Net.socketUdp();
        bufA = Unsafe.malloc(capacity);
        bufB = Unsafe.malloc(capacity);

        lo = bufA;
        hi = lo + capacity;
        ptr = lo;
        lineStart = lo;
    }

    public LineProtoSender $(long timestamp) {
        put(' ').put(timestamp);
        return $();
    }

    public LineProtoSender $() {
        put('\n');
        lineStart = ptr;
        hasMetric = false;
        noFields = true;
        return this;
    }

    @Override
    public void close() {
        Unsafe.getUnsafe().freeMemory(sockaddr);
        Unsafe.free(bufA, capacity);
        Unsafe.free(bufB, capacity);
        Files.close(fd);
    }

    public LineProtoSender field(CharSequence name, long value) {
        field(name).put(value).put('i');
        return this;
    }

    public LineProtoSender field(CharSequence name, CharSequence value) {
        field(name).putQuoted(value);
        return this;
    }

    public LineProtoSender field(CharSequence name, double value, int scale) {
        field(name).put(value, scale).put('i');
        return this;
    }

    @Override
    public void flush() {
        send();
        ptr = lineStart = lo;
    }

    @Override
    public LineProtoSender put(CharSequence cs) {
        int l = cs.length();
        if (ptr + l < hi) {
            Chars.strcpy(cs, l, ptr);
        } else {
            send00();
            if (ptr + l < hi) {
                Chars.strcpy(cs, l, ptr);
            } else {
                throw new RuntimeException("too much!");
            }
        }
        ptr += l;
        return this;
    }

    @Override
    public LineProtoSender put(char c) {
        if (ptr >= hi) {
            send00();
        }
        Unsafe.getUnsafe().putByte(ptr++, (byte) c);
        return this;
    }

    public LineProtoSender metric(CharSequence metric) {
        if (hasMetric) {
            throw new RuntimeException();
        }
        hasMetric = true;
        return put(metric);
    }

    public LineProtoSender tag(CharSequence tag, CharSequence value) {
        if (hasMetric) {
            put(',').putNameEscaped(tag).put('=').putUtf8(value);
            return this;
        }
        throw new RuntimeException();
    }

    private CharSink field(CharSequence name) {
        if (!hasMetric) {
            throw new RuntimeException();
        }

        if (noFields) {
            put(' ');
            noFields = false;
        } else {
            put(',');
        }

        return putNameEscaped(name).put('=');
    }

    private LineProtoSender putNameEscaped(CharSequence name) {
        for (int i = 0, n = name.length(); i < n; i++) {
            char c = name.charAt(i);
            switch (c) {
                case ' ':
                case ',':
                case '=':
                    put('\\');
                default:
                    put(c);
                    break;
            }
        }
        return this;
    }

    private void send() {
        if (lo < lineStart) {
            Net.sendTo(fd, lo, (int) (lineStart - lo), sockaddr);
        }
    }

    private void send00() {
        int len = (int) (ptr - lineStart);
        if (len == 0) {
            send();
            ptr = lineStart = lo;
        } else if (len < capacity) {
            long target = lo == bufA ? bufB : bufA;
            Unsafe.getUnsafe().copyMemory(lineStart, target, len);
            send();
            lineStart = lo = target;
            ptr = target + len;
            hi = lo + capacity;
        } else {
            throw new RuntimeException("too big!");
        }
    }
}