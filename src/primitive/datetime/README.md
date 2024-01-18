# DateTime

## Date Components

### Year

- Uses 2 bytes of memory
- Serializes to 15 bits
- Can represent years in the ISO8601 range: -10000 - 22767 (inclusive)
- Cannot otherwise be invalid (because it uses all 15 bits of numeric space)

- Use .valueOf() for integer years

- .parse() accepts any of the following:
    - "now" (use current year in local time)
    - 1-3 digit integer (0-999) if strict=false (default)
    - 4 digit integer (optionally prefixed by +/- sign)
    - 5 digit integer prefixed by +/- sign (note positive 5 digit years must start with + if strict=true)

### Month

- Uses 1 byte of memory
- Serializes to 4 bits
- Can represent months 1-12 (inclusive)
- Can be invalid (from an untrusted serialized source)
    - There's 4 extra values in base 2

- Use .valueOf() for integer months

- .parse() accepts any of the following:
    - "now" (use current month in local time)
    - 1 digit unsigned integer (1-9) if strict=false (default)
    - 2 digit (zero padded) unsigned integer in range 01-12
    - 3 char locale short form (eg "jan"-"dec" in EN)
    - multi char locale long form (eg "January" - "December" in EN)
NOTE: locale-dependent parsing (short/long name) should only be used when the locale is configured correctly (eg client side, server side the submitted strings may be from a different locale)

### Day (of month)

- Uses 1 byte of memory
- Serializes to 5 bits
- Can represent days 1-31 (inclusive)
- Can be invalid (from an untrusted serialized source)
    - There's 1 extra value in base 2
    - Depending on the month, the max may be lower (eg September, February)

- Use .valueOf() for integer days

- .parse() accepts any of the following:
    - "now" (use current day in local time)
    - 1 digit unsigned integer (1-9) if strict=false (default)
    - 2 digit (zero padded) unsigned integer in range 01-31

### DateOnly

- Uses 4 bytes of memory
- Serializes to 24 bits
- Can represent -10000-01-01 - +22767-12-31
- Can be invalid in the month/day sections (see above)

- Use .valueOf() to get as a 100 shifted integer (eg 2024-01-15 is 20240115)
- Use .toString() to get an RFC3339 (ISO8601) formatted string (eg "2024-01-15")
    - Years always at least 4 digits
    - Years show +/- sign if >4 digits, - if negative, zero year is 1BC
    - Months and days always 2 digits


## Time Components

### Hour

- Uses 1 byte of memory
- Serializes to 5 bits
- Can represent 0 - 23
- Can be invalid (from an untrusted serialized source)
    - There's 8 extra values in base 2

- Use .valueOf() for integer hours

- .parse() accepts any of the following:
    - "now" (use current hour in local time)
    - 1 digit unsigned integer (0-9) if strict=false (default)
    - 2 digit unsigned integer, possibly zero padded (00-23)

### Minute

- Uses 1 byte of memory
- Serializes to 6 bits
- Can represent 0-59
- Can be invalid (from an untrusted serialized source)
    - There's 4 extra values in base 2

- Use .valueOf() for integer minutes

- .parse() accepts any of the following:
    - "now" (use current minute in local time)
    - 1 digit unsigned integer (0-9) if strict=false (default)
    - 2 digit unsigned integer, possibly zero padded (00-59)

### Second

- Uses 1 byte of memory
- Serializes to 6 bits
- No support for leap seconds
- Can represent 0-59
- Can be invalid (from an untrusted serialized source)
    - There's 4 extra values in base 2

- Use .valueOf() for integer seconds

- .parse() accepts any of the following:
    - "now" (use current second in local time)
    - 1 digit unsigned integer (0-9) if strict=false (default)
    - 2 digit unsigned integer, possibly zero padded (00-59)

### SecondMs

- Uses 2 bytes of memory
- Serializes into 16 bits
- No support for leap seconds
- Can represent 0-59999 (in ms) or 0-59.999 (in s)
- Can be invalid (from an untrusted serialized source)
    - There's 5535 extra values in base 2

- Use .second for integer second component (eg 2)
- Use .millisecond for integer millisecond component (eg 24)
- Use .valueOf() for floating second+ms component (eg 2.024)
- Use .valueMs() for integer second+ms component (eg 2024)

- .parse() accepts any of the following:
    - "now" (use current second+ms in local time)
    - 1 digit unsigned integer (0-9) representing seconds only, if strict=false (default)
    - 2 digit unsigned integer (00-59) representing seconds only, if strict=false (default)
    - 2-4 digit unsigned float representing seconds and some ms, if strict=false (default)
    - 5 digit unsigned float representing seconds and ms (zero padded/trailed)

### Microsecond

- Uses 3 bytes of memory
- Serializes into 20 bits
- Can represent 0-999999 (in us) or 0.000000 - 0.999999 (in s)
- Can be invalid (from an untrusted serialized source)
    - There's 48576 extra values in base 2

- Use .valueOf() for integer us

- .parse() accepts any of the following:
    - "now" (use current us in local time)
    - 1-5 digit unsigned integer (0-99999) if strict=false (default)
    - 6 digit unsigned integer, possibly zero padded (000000-999999)

### UtcOrNot

- Uses 1 byte of memory
- Serializes into 1 bit
- Represents whether the time is in UTC or not

- Use .valueOf() for 1=UTC, 0=not
- Use .valueBool() for true=UTC false=not

- .parse() accepts any of the following:
    - an empty string (not UTC)
    - a string of only whitespace (not UTC)
    - a whitespace padded string including 'Z' (UTC)

### TimeOnly

- Uses 7 bytes of memory
- Serializes to 38 bits
- Can represent 0:0:0.000000 - 23:59:59.999999 
- No support for leap seconds
- Can be invalid (from untrusted serialized sources - see above)

- Use .valueOf() to get as a 100 shifted integer (eg 11:41:06.012345 is 114106012345)
- Use .toString() to get an RFC3339 (ISO8601) formatted string (eg "11:41:06.012345Z")
    - Hours are always 2 digits (possibly zero prefixed)
    - Minutes are always 2 digits (possibly zero prefixed)
    - Seconds are always 2 digits (possibly zero prefixed)
    - Microseconds are always 6 digits (possibly zero trailed)
    - If UTC a "Z" will be appended