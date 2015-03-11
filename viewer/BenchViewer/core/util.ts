
interface Array<T>
{
    max(): T;
    min(): T;
}

Array.prototype.max = function()
{
    return Math.max.apply(Math, this);
};

Array.prototype.min = function()
{
    return Math.min.apply(Math, this);
};


module BenchViewer.Core
{
    /**
     * Generates a GUID string.
     * @returns {String} The generated GUID.
     * @example af8a8416-6e18-a307-bd9c-f2c947bbb3aa
     * @author Slavik Meltser (slavik@meltser.info).
     * @link http://slavik.meltser.info/?p=142
     */
    export function guid()
    {
        function p8( s: boolean = false )
        {
            var p = ( Math.random().toString( 16 ) + "000000000" ).substr( 2, 8 );
            return s ? "-" + p.substr( 0, 4 ) + "-" + p.substr( 4, 4 ) : p;
        }

        return p8() + p8( true ) + p8( true ) + p8();
    }

    export function round( x ): number
    {
        if ( x.toString().indexOf( "e" ) >= 0 )
        {
            return Math.round( x );
        }
        var decimals = Config.precision;
        return +( round( x + "e+" + decimals ) + "e-" + decimals );
    }

    export function roundArray(array: number[]): number[]
    {
        return array.map( x => round( x ) );
    }
}