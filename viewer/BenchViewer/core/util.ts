
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